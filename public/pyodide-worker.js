/* global importScripts, pyodide */

let pyodideReady = false
let pyodideInstance = null

async function initPyodide() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js')
  // eslint-disable-next-line no-undef
  pyodideInstance = await loadPyodide()
  try {
    await pyodideInstance.loadPackage(['numpy', 'matplotlib', 'scipy', 'pandas', 'scikit-learn'])
  } catch (err) {
    // If some packages fail to load, continue with what loaded successfully
    console.warn('Some packages failed to load during initialization:', err)
  }
  // Set matplotlib to use non-interactive AGG backend and suppress harmless warnings
  pyodideInstance.runPython(`
import matplotlib
matplotlib.use('agg')
import warnings
warnings.filterwarnings('ignore', message='.*font cache.*')
warnings.filterwarnings('ignore', message='.*FigureCanvasAgg is non-interactive.*')
import matplotlib.pyplot as plt
import sys, io, base64

# Shared helper: save a figure to stdout as __IMG__:base64
def _save_fig_to_stdout(fig):
    _buf = io.BytesIO()
    fig.savefig(_buf, format='png', bbox_inches='tight', dpi=100)
    _buf.seek(0)
    print("__IMG__:" + base64.b64encode(_buf.read()).decode('utf-8'))
    _buf.close()

# Patch plt.show() to capture the current figure and emit it as a base64 PNG to stdout
def _capture_show(*args, **kwargs):
    _save_fig_to_stdout(plt.gcf())
    plt.clf()

plt.show = _capture_show
`)
  pyodideReady = true
  self.postMessage({ type: 'ready' })
}

self.onmessage = async function (event) {
  const { type, code, id } = event.data

  if (type === 'init') {
    if (!pyodideReady) {
      try {
        await initPyodide()
      } catch (err) {
        self.postMessage({ type: 'error', error: String(err), id })
      }
    } else {
      self.postMessage({ type: 'ready' })
    }
    return
  }

  if (type === 'run') {
    if (!pyodideReady) {
      self.postMessage({ type: 'error', error: 'Pyodide not ready yet', id })
      return
    }

    try {
      // Redirect stdout/stderr
      pyodideInstance.runPython(`
import sys, io
_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
`)

      // Auto-install packages imported in user code
      try {
        await pyodideInstance.loadPackagesFromImports(code)
      } catch (pkgErr) {
        // Fall back to micropip with keep_going=True so partial installs succeed
        try {
          const imports = Array.from(
            new Set((code.match(/(?:^|\n)\s*(?:import|from)\s+(\w+)/gm) || []).map(m => m.replace(/.*(?:import|from)\s+/, '')))
          )
          if (imports.length > 0) {
            await pyodideInstance.runPythonAsync(`
import micropip
try:
    await micropip.install(${JSON.stringify(imports)}, keep_going=True)
except Exception:
    pass
`)
          }
        } catch (_) { /* ignore secondary failure */ }
        // Forward a non-fatal warning so the user is informed
        pyodideInstance.runPython(`
import sys
sys.stderr.write("Note: some packages could not be loaded in the browser environment. Use the Daytona sandbox for full Python support.\\n")
`)
      }

      // Run user code
      pyodideInstance.runPython(code)

      // Auto-capture any matplotlib figures that were not explicitly shown via plt.show()
      pyodideInstance.runPython(`
for _fn in plt.get_fignums():
    _save_fig_to_stdout(plt.figure(_fn))
plt.close('all')
`)

      // Collect output
      const stdout = pyodideInstance.runPython('_stdout_buf.getvalue()')
      let stderr = pyodideInstance.runPython('_stderr_buf.getvalue()')

      // Filter out harmless matplotlib warnings from stderr
      const suppressedPattern = /Matplotlib is building the font cache|FigureCanvasAgg is non-interactive/
      stderr = stderr
        .split('\n')
        .filter(line => !suppressedPattern.test(line))
        .join('\n')
        .trim()

      // Restore stdout/stderr and plt.show
      pyodideInstance.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
plt.show = _capture_show
`)

      self.postMessage({ type: 'result', stdout, stderr, id })
    } catch (err) {
      // Attempt to restore stdout/stderr and plt.show even on error
      try {
        pyodideInstance.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
plt.show = _capture_show
`)
      } catch (_) { /* ignore */ }
      self.postMessage({ type: 'error', error: String(err), id })
    }
  }
}

// Start initialization immediately
initPyodide().catch(err => {
  self.postMessage({ type: 'error', error: 'Failed to initialize Pyodide: ' + String(err) })
})
