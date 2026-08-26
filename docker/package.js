const logger = require('logplease').create('package');
const semver = require('semver');
const config = require('./config');
const globals = require('./globals');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs/promises');
const fss = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const runtime = require('./runtime');
const chownr = require('chownr');
const util = require('util');

class Package {
    constructor({ language, version, download, checksum }) {
        this.language = language;
        this.version = semver.parse(version);
        this.checksum = checksum;
        this.download = download;
    }

    get installed() {
        return fss.exists_sync(
            path.join(this.install_path, globals.pkg_installed_file)
        );
    }

    get install_path() {
        return path.join(
            config.data_directory,
            globals.data_directories.packages,
            this.language,
            this.version.raw
        );
    }

    async install() {
        if (this.installed) {
            throw new Error('Already installed');
        }

        logger.info(`Installing ${this.language}-${this.version.raw}`);

        if (fss.exists_sync(this.install_path)) {
            logger.warn(
                `${this.language}-${this.version.raw} has residual files. Removing them.`
            );
            await fs.rm(this.install_path, { recursive: true, force: true });
        }

        logger.debug(`Making directory ${this.install_path}`);
        await fs.mkdir(this.install_path, { recursive: true });

        logger.info(
            `Downloading package from ${this.download} in to ${this.install_path}`
        );
        const pkgpath = path.join(this.install_path, 'pkg.tar.gz');
        const download = await fetch(this.download);
        logger.info(`Download status for ${this.language}: ${download.status}`);

        if (!download.ok) {
            const errText = await download.text();
            logger.error(`Failed download ${download.status}: ${errText}`);
            throw new Error(`Download failed with status ${download.status}`);
        }

        const file_stream = fss.create_write_stream(pkgpath);
        await new Promise((resolve, reject) => {
            download.body.pipe(file_stream);
            download.body.on('error', (err) => {
                logger.error(`Stream error: ${err}`);
                reject(err);
            });

            file_stream.on('finish', resolve);
        });

        logger.info('Validating checksums');
        logger.info(`Assert sha256(pkg.tar.gz) == ${this.checksum}`);
        const hash = crypto.create_hash('sha256');

        const read_stream = fss.create_read_stream(pkgpath);
        await new Promise((resolve, reject) => {
            read_stream.on('data', chunk => hash.update(chunk));
            read_stream.on('end', () => resolve());
            read_stream.on('error', error => reject(error));
        });

        const cs = hash.digest('hex');

        if (cs !== this.checksum) {
            logger.error(`Checksum mismatch! Want: ${this.checksum}, got: ${cs}`);
            throw new Error(
                `Checksum miss-match want: ${this.checksum} got: ${cs}`
            );
        }

        logger.info(
            `Extracting package files from archive ${pkgpath} in to ${this.install_path}`
        );

        await new Promise((resolve, reject) => {
            const proc = cp.exec(
                `bash -c 'cd "${this.install_path}" && tar xzf ${pkgpath}'`
            );

            proc.once('exit', (code, _) => {
                if (code === 0) {
                    resolve();
                } else {
                    logger.error(`tar exit code: ${code}`);
                    reject(new Error(`tar exit code ${code}`));
                }
            });

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.once('error', (err) => {
                logger.error(`tar error: ${err}`);
                reject(err);
            });
        });

        logger.info('Registering runtime');
        runtime.load_package(this.install_path);

        logger.debug('Caching environment');
        const get_env_command = `cd ${this.install_path}; source environment; env`;

        const envout = await new Promise((resolve, reject) => {
            let stdout = '';

            const proc = cp.spawn(
                'env',
                ['-i', 'bash', '-c', `${get_env_command}`],
                {
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            );

            proc.once('exit', (code, _) => {
                code === 0 ? resolve(stdout) : reject();
            });

            proc.stdout.on('data', data => {
                stdout += data;
            });

            proc.once('error', reject);
        });

        const filtered_env = envout
            .split('\n')
            .filter(
                l =>
                    !['PWD', 'OLDPWD', '_', 'SHLVL'].includes(
                        l.split('=', 2)[0]
                    )
            )
            .join('\n');

        await fs.write_file(path.join(this.install_path, '.env'), filtered_env);

        logger.debug('Changing Ownership of package directory');
        await util.promisify(chownr)(
            this.install_path,
            process.getuid(),
            process.getgid()
        );

        logger.debug('Writing installed state to disk');
        await fs.write_file(
            path.join(this.install_path, globals.pkg_installed_file),
            Date.now().toString()
        );

        logger.info(`Installed ${this.language}-${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw,
        };
    }

    async uninstall() {
        logger.info(`Uninstalling ${this.language}-${this.version.raw}`);

        logger.debug('Finding runtime');
        const found_runtime = runtime.get_runtime_by_name_and_version(
            this.language,
            this.version.raw
        );

        if (!found_runtime) {
            logger.error(
                `Uninstalling ${this.language}-${this.version.raw} failed: Not installed`
            );
            throw new Error(
                `${this.language}-${this.version.raw} is not installed`
            );
        }

        logger.debug('Unregistering runtime');
        found_runtime.unregister();

        logger.debug('Cleaning files from disk');
        await fs.rmdir(this.install_path, { recursive: true });

        logger.info(`Uninstalled ${this.language}-${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw,
        };
    }

    static async get_package_list() {
        const repo_content = await fetch(config.repo_url).then(x => x.text());

        const entries = repo_content.split('\n').filter(x => x.length > 0);

        return entries.map(line => {
            const [language, version, checksum, download] = line.split(',', 4);

            return new Package({
                language,
                version,
                checksum,
                download,
            });
        });
    }

    static async get_package(lang, version) {
        const packages = await Package.get_package_list();

        const candidates = packages.filter(pkg => {
            return (
                pkg.language == lang && semver.satisfies(pkg.version, version)
            );
        });

        candidates.sort((a, b) => semver.rcompare(a.version, b.version));

        return candidates[0] || null;
    }
}

module.exports = Package;
