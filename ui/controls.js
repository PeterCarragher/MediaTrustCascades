const el    = id => document.getElementById(id)
const val   = id => parseFloat(el(id).value)
const check = id => el(id).checked

export function readParams() {
  return {
    diagonal: check('diagonal'),
    trustBuildRate: val('trust-build-rate'),
    trustThreshold: val('trust-threshold'),
    factcheckInterval: val('factcheck-interval'),
    errorRate:         val('error-rate'),
    errorMean:      val('error-mean'),
    errorStd:       val('error-std'),
    copyLikelihood:            val('copy-likelihood'),
    contagionThreshold:        val('contagion-threshold'),
    propagationResetThreshold: val('propagation-reset-threshold'),
  }
}

export function initControls({ reset, togglePlay, isPlaying }) {
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
