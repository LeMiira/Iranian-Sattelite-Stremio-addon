import { LiveChannel } from '../types';

export function parseM3U(content: string): LiveChannel[] {
  const channels: LiveChannel[] = [];
  const lines = content.split(/\r?\n/);
  
  let currentInfo: {
    name: string;
    logo?: string;
    category: string;
    epgId?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse metadata
      // Example: #EXTINF:-1 tvg-id="BBCPersian" tvg-name="BBC Persian" tvg-logo="http://..." group-title="News",BBC Persian
      const infoPart = line.substring(8);
      
      // Extract properties using regex
      const tvgIdMatch = infoPart.match(/tvg-id="([^"]+)"/i);
      const tvgLogoMatch = infoPart.match(/tvg-logo="([^"]+)"/i);
      const groupTitleMatch = infoPart.match(/group-title="([^"]+)"/i);
      
      // The channel name is usually everything after the last comma
      const commaIndex = infoPart.lastIndexOf(',');
      let name = 'Unknown IPTV Channel';
      if (commaIndex !== -1) {
        name = infoPart.substring(commaIndex + 1).trim();
      }

      const category = groupTitleMatch ? groupTitleMatch[1].trim() : 'General';
      const logo = tvgLogoMatch ? tvgLogoMatch[1].trim() : undefined;
      const epgId = tvgIdMatch ? tvgIdMatch[1].trim() : undefined;

      currentInfo = {
        name,
        logo,
        category,
        epgId,
      };
    } else if (line.startsWith('#')) {
      // Ignore other tag lines
      continue;
    } else {
      // This is the URL line
      if (currentInfo) {
        const streamUrl = line;
        
        // Generate a deterministic ID based on the stream URL to prevent duplicates
        const cleanUrl = streamUrl.split('?')[0] || streamUrl;
        const id = 'iptv:' + Buffer.from(cleanUrl).toString('base64').substring(0, 16).replace(/[^a-zA-Z0-9]/g, '');

        channels.push({
          id,
          name: currentInfo.name,
          logo: currentInfo.logo,
          category: currentInfo.category,
          streamUrl,
          epgId: currentInfo.epgId,
          isCustom: true,
          status: 'unknown',
          lastChecked: new Date().toISOString(),
        });
        currentInfo = null;
      }
    }
  }

  return channels;
}
