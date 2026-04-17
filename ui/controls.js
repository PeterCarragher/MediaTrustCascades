const el    = id => document.getElementById(id)
const val   = id => parseFloat(el(id).value)
const check = id => el(id).checked

export function readParams() {
  return {
    // toggles
    outletInfluenceEnabled: check('outlet-influence'),
    factChecksEnabled:      check('fact-checks'),
    layoffsEnabled:         check('layoffs'),
    acquisitionsEnabled:    check('acquisitions'),
    // publication / copying
    baseLikelihood:      val('base-likelihood'),
    adjacencyMultiplier: val('adjacency-multiplier'),
    baseCopyRate:        val('base-copy-rate'),
    // outlet / article
    outletSpread: val('outlet-spread'),
    articleLifespan: val('article-lifespan'),
    coolingDuration: val('cooling-duration'),
    // fact checks
    factCheckRate:             val('fact-check-rate'),
    errorPropagationLikelihood: val('error-propagation'),
    // layoffs
    layoffRate:      val('layoff-rate'),
    layoffEffect:    val('layoff-effect'),
    layoffCopyBoost: val('layoff-copy-boost'),
    // acquisitions
    acquisitionRate:  val('acquisition-rate'),
    acquisitionBoost: val('acquisition-boost'),
  }
}

export function initControls({ reset, togglePlay, isPlaying }) {
  // Keep value labels in sync with sliders
  document.querySelectorAll('input[type="range"]').forEach(input => {
    const label = el(input.id + '-val')
    if (!label) return
    label.textContent = input.value
    input.addEventListener('input', () => { label.textContent = input.value })
  })

  el('btn-reset').addEventListener('click', reset)

  el('btn-play').addEventListener('click', () => {
    togglePlay()
    el('btn-play').textContent = isPlaying() ? 'Pause' : 'Play'
  })
}
