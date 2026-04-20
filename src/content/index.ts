import { runLinkedInContent } from "./linkedin";
import { runRedditContent } from "./reddit";
import { runTwitchContent } from "./twitch";
import { runYouTubeContent } from "./youtube";

if (location.hostname.endsWith("twitch.tv")) {
  runTwitchContent();
} else if (location.hostname.endsWith("linkedin.com")) {
  runLinkedInContent();
} else if (location.hostname.endsWith("reddit.com")) {
  runRedditContent();
} else if (location.hostname.endsWith("youtube.com")) {
  runYouTubeContent();
}
