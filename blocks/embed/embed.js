/* stylelint-disable */

const YOUTUBE_RE = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]+)/;

function getYouTubeId(url) {
  const match = url.match(YOUTUBE_RE);
  return match ? match[1] : null;
}

export default function decorate(block) {
  const link = block.querySelector('a');
  if (!link) return;

  const url = link.href;
  const videoId = getYouTubeId(url);

  if (videoId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-youtube';

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('title', 'YouTube video player');
    iframe.setAttribute('frameborder', '0');

    wrapper.append(iframe);
    block.textContent = '';
    block.append(wrapper);
  }
}
