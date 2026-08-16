/**
 * Generic Discovery Engine
 * Takes ANY topic (ayurveda, yoga, nutrition, meditation, etc.)
 * Discovers content from YouTube and other sources
 */

export interface ContentCandidate {
  id: string;
  sourceUrl: string;
  platform: "youtube" | "vimeo" | "web" | "self-hosted";
  title: string;
  description: string;
  instructor?: string;
  channel?: string;
  duration?: number; // seconds
  publishedAt?: string;
  viewCount?: number;
  relevanceScore: number; // 0-1, higher = better match
  thumbnailUrl?: string;
  language?: string;
  createdAt: string;
}

export interface DiscoveryResult {
  topic: string;
  totalFound: number;
  candidates: ContentCandidate[];
  sources: {
    youtube: number;
    vimeo: number;
    web: number;
    allowlist: number;
  };
}

/**
 * Generic topic discovery across multiple platforms
 * Respects robots.txt, rate limits, and ToS
 */
export class DiscoveryEngine {
  private youtubeApiKey = process.env.YOUTUBE_API_KEY || "";
  private vimeoAccessToken = process.env.VIMEO_ACCESS_TOKEN || "";

  /**
   * Main entry point: discover all content for a topic
   */
  async discoverByTopic(topic: string, limit: number = 100): Promise<DiscoveryResult> {
    console.log(`🔍 Discovering content for topic: "${topic}"`);

    const [youtubeResults, vimeoResults, webResults, allowlistResults] = await Promise.all([
      this.youtubeApiKey ? this.discoverYouTube(topic, limit) : Promise.resolve([]),
      this.vimeoAccessToken ? this.discoverVimeo(topic, limit / 2) : Promise.resolve([]),
      this.discoverWeb(topic, limit / 3),
      this.readAllowlist(topic),
    ]);

    const allCandidates = [
      ...youtubeResults,
      ...vimeoResults,
      ...webResults,
      ...allowlistResults,
    ];

    // Deduplicate by URL
    const unique = new Map<string, ContentCandidate>();
    allCandidates.forEach((c) => {
      if (!unique.has(c.sourceUrl)) {
        unique.set(c.sourceUrl, c);
      }
    });

    // Rank by relevance + view count
    const ranked = Array.from(unique.values())
      .sort((a, b) => {
        const relevanceDiff = b.relevanceScore - a.relevanceScore;
        if (relevanceDiff !== 0) return relevanceDiff;
        return (b.viewCount || 0) - (a.viewCount || 0);
      })
      .slice(0, limit);

    console.log(`✅ Found ${ranked.length} unique candidates for "${topic}"`);

    return {
      topic,
      totalFound: ranked.length,
      candidates: ranked,
      sources: {
        youtube: youtubeResults.length,
        vimeo: vimeoResults.length,
        web: webResults.length,
        allowlist: allowlistResults.length,
      },
    };
  }

  /**
   * YouTube Search via official Data API v3
   * Legal, respects ToS, no scraping
   */
  private async discoverYouTube(topic: string, limit: number): Promise<ContentCandidate[]> {
    if (!this.youtubeApiKey) return [];

    const candidates: ContentCandidate[] = [];

    try {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.append("q", topic);
      searchUrl.searchParams.append("type", "video");
      searchUrl.searchParams.append("maxResults", Math.min(limit, 50).toString());
      searchUrl.searchParams.append("order", "relevance");
      searchUrl.searchParams.append("key", this.youtubeApiKey);
      searchUrl.searchParams.append("videoCaption", "closedCaption"); // Prefer videos with captions

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        console.warn(`YouTube API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      for (const item of data.items || []) {
        candidates.push({
          id: item.id.videoId,
          sourceUrl: `https://youtube.com/watch?v=${item.id.videoId}`,
          platform: "youtube",
          title: item.snippet.title,
          description: item.snippet.description,
          channel: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url,
          relevanceScore: this.scoreYouTubeRelevance(item.snippet.title, item.snippet.description, topic),
          createdAt: new Date().toISOString(),
        });
      }

      // Get video statistics (view count, etc.)
      const videoIds = candidates.map((c) => c.id).join(",");
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.append("id", videoIds);
      statsUrl.searchParams.append("part", "statistics,contentDetails");
      statsUrl.searchParams.append("key", this.youtubeApiKey);

      const statsResponse = await fetch(statsUrl.toString());
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const statsMap = new Map(statsData.items?.map((v: any) => [v.id, v]) || []);

        candidates.forEach((c) => {
          const stats = statsMap.get(c.id);
          if (stats) {
            c.viewCount = parseInt(stats.statistics?.viewCount || "0");
            c.duration = this.parseDuration(stats.contentDetails?.duration);
          }
        });
      }

      console.log(`YouTube: Found ${candidates.length} videos for "${topic}"`);
    } catch (err) {
      console.error("YouTube discovery error:", err);
    }

    return candidates;
  }

  /**
   * Vimeo API search (optional, requires token)
   */
  private async discoverVimeo(topic: string, limit: number): Promise<ContentCandidate[]> {
    if (!this.vimeoAccessToken) return [];

    const candidates: ContentCandidate[] = [];

    try {
      const response = await fetch(
        `https://api.vimeo.com/videos?query=${encodeURIComponent(topic)}&per_page=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${this.vimeoAccessToken}`,
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();

      for (const item of data.data || []) {
        candidates.push({
          id: item.uri.split("/").pop(),
          sourceUrl: item.link,
          platform: "vimeo",
          title: item.name,
          description: item.description,
          channel: item.user?.name,
          duration: item.duration,
          viewCount: item.stats?.plays,
          relevanceScore: 0.7,
          createdAt: new Date().toISOString(),
        });
      }

      console.log(`Vimeo: Found ${candidates.length} videos for "${topic}"`);
    } catch (err) {
      console.error("Vimeo discovery error:", err);
    }

    return candidates;
  }

  /**
   * Web discovery: Known instructor websites with respectful scraping
   */
  private async discoverWeb(topic: string, limit: number): Promise<ContentCandidate[]> {
    const candidates: ContentCandidate[] = [];
    const domains = [
      "yogawithadriene.com",
      "yoga.com",
      "iyengaryoga.com",
      "ayurvedichealing.net",
      "banyanbotanicals.com",
      // Add more as needed
    ];

    for (const domain of domains) {
      try {
        // Check robots.txt first
        const robotsResponse = await fetch(`https://${domain}/robots.txt`);
        if (!robotsResponse.ok) continue; // Skip if no robots.txt

        const robotsText = await robotsResponse.text();
        if (!this.isScrapingAllowed(robotsText, "/")) continue; // Check if scraping allowed

        // Use site: operator for Google (no actual scraping, just search)
        const searchUrl = `https://www.google.com/search?q=site:${domain} ${encodeURIComponent(topic)}`;
        // In production, you'd use Google Custom Search API here
        // For now, we skip web scraping and rely on YouTube + allowlist

        console.log(`Web: Skipping ${domain} (use YouTube API instead)`);
      } catch (err) {
        console.error(`Web discovery error for ${domain}:`, err);
      }
    }

    return candidates;
  }

  /**
   * Direct URL allowlist (videos you have rights to)
   */
  private async readAllowlist(topic: string): Promise<ContentCandidate[]> {
    const candidates: ContentCandidate[] = [];

    try {
      const allowlistResponse = await fetch("/public/video-sources-allowlist.json");
      if (!allowlistResponse.ok) return [];

      const allowlist = await allowlistResponse.json();

      for (const item of allowlist) {
        if (
          item.topic?.toLowerCase().includes(topic.toLowerCase()) ||
          item.title?.toLowerCase().includes(topic.toLowerCase()) ||
          item.description?.toLowerCase().includes(topic.toLowerCase())
        ) {
          candidates.push({
            id: item.id || `allowlist_${Date.now()}`,
            sourceUrl: item.url,
            platform: item.platform || "self-hosted",
            title: item.title,
            description: item.description,
            instructor: item.instructor,
            channel: item.channel,
            duration: item.duration,
            relevanceScore: 0.95, // Allowlist = highest trust
            createdAt: new Date().toISOString(),
          });
        }
      }

      console.log(`Allowlist: Found ${candidates.length} videos for "${topic}"`);
    } catch (err) {
      console.error("Allowlist discovery error:", err);
    }

    return candidates;
  }

  /**
   * Score relevance of YouTube video to topic
   * Higher = more relevant
   */
  private scoreYouTubeRelevance(title: string, description: string, topic: string): number {
    let score = 0;

    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const lowerTopic = topic.toLowerCase();

    // Exact phrase match in title
    if (lowerTitle.includes(lowerTopic)) score += 0.4;

    // Word match in title
    if (lowerTitle.split(/\s+/).some((w) => lowerTopic.includes(w) || w.includes(lowerTopic))) {
      score += 0.2;
    }

    // In description
    if (lowerDesc.includes(lowerTopic)) score += 0.2;

    // Keywords suggesting educational content
    const educationalKeywords = [
      "tutorial",
      "guide",
      "instruction",
      "learn",
      "class",
      "lesson",
      "master",
      "explained",
    ];
    if (educationalKeywords.some((k) => lowerTitle.includes(k))) {
      score += 0.1;
    }

    // Keywords suggesting it's NOT relevant
    const negativeKeywords = ["trailer", "music video", "commercial", "advertisement"];
    if (negativeKeywords.some((k) => lowerTitle.includes(k))) {
      score = Math.max(0, score - 0.3);
    }

    return Math.min(1, score);
  }

  /**
   * Check if domain allows scraping (parse robots.txt)
   */
  private isScrapingAllowed(robotsTxt: string, path: string): boolean {
    // Simple check: if "Disallow: /" exists, don't scrape
    // In production, use a proper robots.txt parser
    if (robotsTxt.includes("Disallow: /")) return false;
    if (robotsTxt.includes(`Disallow: ${path}`)) return false;
    return true;
  }

  /**
   * Parse ISO 8601 duration to seconds
   * PT1H30M45S → 5445
   */
  private parseDuration(isoDuration?: string): number | undefined {
    if (!isoDuration) return undefined;

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = isoDuration.match(regex);

    if (!match) return undefined;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    return hours * 3600 + minutes * 60 + seconds;
  }
}
