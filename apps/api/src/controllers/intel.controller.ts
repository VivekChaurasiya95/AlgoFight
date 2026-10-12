import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@algofight/database";
import { auditService } from "../services/audit.service";
import { extractClientIp } from "../utils/ip.util";

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = (content || "").trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export class IntelController {
    // ==========================================
    // PUBLIC ENDPOINTS
    // ==========================================

    async getFeed(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = (request.query as any) || {};
            const page = Math.max(1, parseInt(query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 9));
            const skip = (page - 1) * limit;
            const category = query.category?.toUpperCase();
            const search = (query.search || "").trim();

            const where: any = {
                status: "PUBLISHED",
            };

            if (category && category !== "ALL") {
                where.category = category;
            }

            if (search) {
                where.OR = [
                    { title: { contains: search, mode: "insensitive" } },
                    { summary: { contains: search, mode: "insensitive" } },
                ];
            }

            const [total, posts] = await Promise.all([
                prisma.intelPost.count({ where }),
                prisma.intelPost.findMany({
                    where,
                    include: {
                        eventDetails: true,
                    },
                    orderBy: [
                        { isFeatured: "desc" },
                        { publishedAt: "desc" },
                        { createdAt: "desc" },
                    ],
                    skip,
                    take: limit,
                }),
            ]);

            return reply.send({
                success: true,
                posts,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to fetch Intel feed.",
            });
        }
    }

    async getFeatured(request: FastifyRequest, reply: FastifyReply) {
        try {
            let featured = await prisma.intelPost.findFirst({
                where: {
                    status: "PUBLISHED",
                    isFeatured: true,
                },
                include: {
                    eventDetails: true,
                },
                orderBy: {
                    publishedAt: "desc",
                },
            });

            // Safe fallback to latest published post if none is marked as featured
            if (!featured) {
                featured = await prisma.intelPost.findFirst({
                    where: {
                        status: "PUBLISHED",
                    },
                    include: {
                        eventDetails: true,
                    },
                    orderBy: {
                        publishedAt: "desc",
                    },
                });
            }

            return reply.send({
                success: true,
                post: featured,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to fetch featured post.",
            });
        }
    }

    async getEvents(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = (request.query as any) || {};
            const eventType = query.type?.toUpperCase();
            const now = new Date();

            const where: any = {
                status: "PUBLISHED",
            };

            const validEventTypes = ["TOURNAMENT", "WORKSHOP", "FEATURE_LAUNCH", "SEASON_RESET", "COMMUNITY"];

            if (eventType && eventType !== "ALL") {
                if (eventType === "RUNTIME_RELEASE") {
                    where.eventDetails = {
                        is: {
                            eventType: "FEATURE_LAUNCH",
                        },
                    };
                } else if (validEventTypes.includes(eventType)) {
                    where.eventDetails = {
                        is: {
                            eventType: eventType as any,
                        },
                    };
                } else {
                    where.eventDetails = {
                        isNot: null,
                    };
                }
            } else {
                where.eventDetails = {
                    isNot: null,
                };
            }

            const postsWithEvents = await prisma.intelPost.findMany({
                where,
                include: {
                    eventDetails: true,
                },
                orderBy: {
                    eventDetails: {
                        startsAt: "asc",
                    },
                },
            });

            // Derive dynamic lifecycle status for each event
            const resolvedEvents = postsWithEvents.map((post) => {
                const event = post.eventDetails!;
                let derivedStatus = event.launchStatus;

                if (event.launchStatus !== "CANCELLED" && event.launchStatus !== "POSTPONED") {
                    const startsAt = new Date(event.startsAt);
                    const endsAt = event.endsAt ? new Date(event.endsAt) : null;

                    if (now < startsAt) {
                        derivedStatus = "UPCOMING";
                    } else if (endsAt && now > endsAt) {
                        derivedStatus = "LIVE"; // or completed
                    } else {
                        derivedStatus = "LIVE";
                    }
                }

                return {
                    ...post,
                    eventDetails: {
                        ...event,
                        resolvedStatus: derivedStatus,
                    },
                };
            });

            return reply.send({
                success: true,
                events: resolvedEvents,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to fetch Intel events.",
            });
        }
    }

    async getBySlug(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { slug } = request.params as { slug: string };
            const adminKey = request.headers["x-admin-key"];
            const isSuperAdmin = !!adminKey; // Allow previewing drafts if admin

            const where: any = { slug };
            if (!isSuperAdmin) {
                where.status = "PUBLISHED";
            }

            const post = await prisma.intelPost.findFirst({
                where,
                include: {
                    eventDetails: true,
                },
            });

            if (!post) {
                return reply.status(404).send({
                    error: "NOT_FOUND",
                    message: "Article or announcement not found.",
                });
            }

            // Increment views in background (fire-and-forget for public queries)
            if (!isSuperAdmin) {
                prisma.intelPost.update({
                    where: { id: post.id },
                    data: { views: { increment: 1 } },
                }).catch(() => {});
            }

            // Related stories in same category
            const relatedPosts = await prisma.intelPost.findMany({
                where: {
                    status: "PUBLISHED",
                    category: post.category,
                    id: { not: post.id },
                },
                take: 3,
                orderBy: {
                    publishedAt: "desc",
                },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    summary: true,
                    category: true,
                    coverImageUrl: true,
                    publishedAt: true,
                    readingTimeMin: true,
                },
            });

            return reply.send({
                success: true,
                post,
                relatedPosts,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to load article.",
            });
        }
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    async adminGetPosts(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = (request.query as any) || {};
            const page = Math.max(1, parseInt(query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
            const skip = (page - 1) * limit;
            const status = query.status?.toUpperCase();
            const category = query.category?.toUpperCase();
            const search = (query.search || "").trim();

            const where: any = {};
            if (status && status !== "ALL") where.status = status;
            if (category && category !== "ALL") where.category = category;
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: "insensitive" } },
                    { summary: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                ];
            }

            const [total, posts] = await Promise.all([
                prisma.intelPost.count({ where }),
                prisma.intelPost.findMany({
                    where,
                    include: {
                        eventDetails: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: limit,
                }),
            ]);

            return reply.send({
                success: true,
                posts,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to list admin Intel posts.",
            });
        }
    }

    async adminCreatePost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = (request.body as any) || {};
            const {
                title,
                summary,
                content,
                category = "ANNOUNCEMENT",
                coverImageUrl,
                authorName = "AlgoFight Team",
                authorAvatar,
                status = "DRAFT",
                isFeatured = false,
                eventDetails,
            } = body;

            if (!title || !content) {
                return reply.status(400).send({
                    error: "BAD_REQUEST",
                    message: "Title and content body are required.",
                });
            }

            let slug = body.slug ? slugify(body.slug) : slugify(title);
            if (!slug) slug = `post-${Date.now()}`;

            // Check slug uniqueness; append random suffix if collision
            const existing = await prisma.intelPost.findUnique({ where: { slug } });
            if (existing) {
                slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
            }

            const readingTimeMin = calculateReadingTime(content);
            const publishedAt = status === "PUBLISHED" ? new Date() : null;

            const post = await prisma.intelPost.create({
                data: {
                    title,
                    slug,
                    summary: summary || title,
                    content,
                    category,
                    coverImageUrl,
                    authorName,
                    authorAvatar,
                    status,
                    isFeatured: Boolean(isFeatured),
                    readingTimeMin,
                    publishedAt,
                    ...(eventDetails && eventDetails.startsAt
                        ? {
                              eventDetails: {
                                  create: {
                                      eventType: eventDetails.eventType || "FEATURE_LAUNCH",
                                      versionTag: eventDetails.versionTag || null,
                                      startsAt: new Date(eventDetails.startsAt),
                                      endsAt: eventDetails.endsAt ? new Date(eventDetails.endsAt) : null,
                                      timezone: eventDetails.timezone || "UTC",
                                      registrationOpensAt: eventDetails.registrationOpensAt
                                          ? new Date(eventDetails.registrationOpensAt)
                                          : null,
                                      registrationClosesAt: eventDetails.registrationClosesAt
                                          ? new Date(eventDetails.registrationClosesAt)
                                          : null,
                                      actionUrl: eventDetails.actionUrl || null,
                                      actionLabel: eventDetails.actionLabel || null,
                                      location: eventDetails.location || "Online - AlgoFight Arena",
                                      isOnline: eventDetails.isOnline ?? true,
                                      launchStatus: eventDetails.launchStatus || "UPCOMING",
                                  },
                              },
                          }
                        : {}),
                },
                include: {
                    eventDetails: true,
                },
            });

            auditService.recordEvent({
                category: "SYSTEM",
                severity: "INFO",
                action: "INTEL_POST_CREATED",
                actor: (request as any).user?.username || "SuperAdmin",
                ip: extractClientIp(request),
                method: "POST",
                details: `Created Intel Post: "${post.title}" (${post.slug}) [${post.status}]`,
            });

            return reply.status(201).send({
                success: true,
                post,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to create Intel post.",
            });
        }
    }

    async adminUpdatePost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const body = (request.body as any) || {};

            const existing = await prisma.intelPost.findUnique({
                where: { id },
                include: { eventDetails: true },
            });

            if (!existing) {
                return reply.status(404).send({
                    error: "NOT_FOUND",
                    message: "Intel post not found.",
                });
            }

            const updateData: any = {};
            if (body.title !== undefined) updateData.title = body.title;
            if (body.summary !== undefined) updateData.summary = body.summary;
            if (body.content !== undefined) {
                updateData.content = body.content;
                updateData.readingTimeMin = calculateReadingTime(body.content);
            }
            if (body.category !== undefined) updateData.category = body.category;
            if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl;
            if (body.authorName !== undefined) updateData.authorName = body.authorName;
            if (body.authorAvatar !== undefined) updateData.authorAvatar = body.authorAvatar;
            if (body.isFeatured !== undefined) updateData.isFeatured = Boolean(body.isFeatured);

            if (body.slug !== undefined && body.slug !== existing.slug) {
                let newSlug = slugify(body.slug);
                const collision = await prisma.intelPost.findUnique({ where: { slug: newSlug } });
                if (collision && collision.id !== id) {
                    newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
                }
                updateData.slug = newSlug;
            }

            if (body.status !== undefined) {
                updateData.status = body.status;
                if (body.status === "PUBLISHED" && !existing.publishedAt) {
                    updateData.publishedAt = new Date();
                }
            }

            // Handle event details update / upsert / removal
            const eventDetails = body.eventDetails;
            if (eventDetails !== undefined) {
                if (eventDetails && eventDetails.startsAt) {
                    updateData.eventDetails = {
                        upsert: {
                            create: {
                                eventType: eventDetails.eventType || "FEATURE_LAUNCH",
                                versionTag: eventDetails.versionTag || null,
                                startsAt: new Date(eventDetails.startsAt),
                                endsAt: eventDetails.endsAt ? new Date(eventDetails.endsAt) : null,
                                timezone: eventDetails.timezone || "UTC",
                                registrationOpensAt: eventDetails.registrationOpensAt
                                    ? new Date(eventDetails.registrationOpensAt)
                                    : null,
                                registrationClosesAt: eventDetails.registrationClosesAt
                                    ? new Date(eventDetails.registrationClosesAt)
                                    : null,
                                actionUrl: eventDetails.actionUrl || null,
                                actionLabel: eventDetails.actionLabel || null,
                                location: eventDetails.location || "Online - AlgoFight Arena",
                                isOnline: eventDetails.isOnline ?? true,
                                launchStatus: eventDetails.launchStatus || "UPCOMING",
                            },
                            update: {
                                eventType: eventDetails.eventType || "FEATURE_LAUNCH",
                                versionTag: eventDetails.versionTag || null,
                                startsAt: new Date(eventDetails.startsAt),
                                endsAt: eventDetails.endsAt ? new Date(eventDetails.endsAt) : null,
                                timezone: eventDetails.timezone || "UTC",
                                registrationOpensAt: eventDetails.registrationOpensAt
                                    ? new Date(eventDetails.registrationOpensAt)
                                    : null,
                                registrationClosesAt: eventDetails.registrationClosesAt
                                    ? new Date(eventDetails.registrationClosesAt)
                                    : null,
                                actionUrl: eventDetails.actionUrl || null,
                                actionLabel: eventDetails.actionLabel || null,
                                location: eventDetails.location || "Online - AlgoFight Arena",
                                isOnline: eventDetails.isOnline ?? true,
                                launchStatus: eventDetails.launchStatus || "UPCOMING",
                            },
                        },
                    };
                } else if (existing.eventDetails && eventDetails === null) {
                    // Explicitly remove attached event
                    await prisma.intelEvent.delete({ where: { postId: id } });
                }
            }

            const updated = await prisma.intelPost.update({
                where: { id },
                data: updateData,
                include: { eventDetails: true },
            });

            return reply.send({
                success: true,
                post: updated,
            });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to update Intel post.",
            });
        }
    }

    async adminPublishPost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const post = await prisma.intelPost.update({
                where: { id },
                data: {
                    status: "PUBLISHED",
                    publishedAt: new Date(),
                },
                include: { eventDetails: true },
            });

            auditService.recordEvent({
                category: "SYSTEM",
                severity: "INFO",
                action: "INTEL_POST_PUBLISHED",
                actor: (request as any).user?.username || "SuperAdmin",
                ip: extractClientIp(request),
                method: "POST",
                details: `Published Intel Post: "${post.title}"`,
            });

            return reply.send({ success: true, post });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to publish post.",
            });
        }
    }

    async adminUnpublishPost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const post = await prisma.intelPost.update({
                where: { id },
                data: {
                    status: "DRAFT",
                },
                include: { eventDetails: true },
            });

            return reply.send({ success: true, post });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to unpublish post.",
            });
        }
    }

    async adminDeletePost(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            await prisma.intelPost.delete({ where: { id } });

            auditService.recordEvent({
                category: "SYSTEM",
                severity: "WARN",
                action: "INTEL_POST_DELETED",
                actor: (request as any).user?.username || "SuperAdmin",
                ip: extractClientIp(request),
                method: "DELETE",
                details: `Deleted Intel Post: ${id}`,
            });

            return reply.send({ success: true, message: "Post deleted successfully." });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message || "Failed to delete post.",
            });
        }
    }
}
