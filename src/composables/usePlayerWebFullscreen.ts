import { onUnmounted } from 'vue'

import { isInIframe, isVideoOrBangumiPage, queryDomUntilFound } from '~/utils/main'

const WEB_FULL_SCREEN_BTN_SELECTOR = '.bpx-player-ctrl-btn.bpx-player-ctrl-web'

/**
 * Watch the Bilibili player web fullscreen state (网页全屏) on video & bangumi
 * pages and call `onChange` on every state change, so the top bar can collapse
 * while the player fills the viewport.
 *
 * Does nothing on non-video pages or inside iframes (the drawer scenario
 * handles its own detection via postMessage, see `App.vue`).
 */
export function usePlayerWebFullscreen(onChange: (entered: boolean) => void) {
  if (!isVideoOrBangumiPage() || isInIframe())
    return

  let observer: MutationObserver | undefined

  const abort = new AbortController()

  queryDomUntilFound(WEB_FULL_SCREEN_BTN_SELECTOR, 500, abort).then((openVideo2WebFullBtn) => {
    if (!openVideo2WebFullBtn)
      return

    const reportState = () => {
      // If the user navigated away from video pages (e.g. via SPA routing),
      // restore the top bar and stop watching to avoid getting stuck hidden
      if (!isVideoOrBangumiPage()) {
        onChange(false)
        observer?.disconnect()
        return
      }
      onChange(openVideo2WebFullBtn.classList.contains('bpx-state-entered'))
    }

    observer = new MutationObserver(reportState)
    observer.observe(openVideo2WebFullBtn, { attributes: true, attributeFilter: ['class'] })
    // Report the initial state, e.g. when landing on an already web-fullscreen player
    reportState()
  })

  onUnmounted(() => {
    observer?.disconnect()
    abort.abort()
  })
}
