const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const waitOn = require('wait-on')
const path = require('path')

let nextProcess = null

async function createWindow() {
  // Levanta el servidor Next.js
  nextProcess = spawn('node', [path.join(__dirname, '../node_modules/.bin/next'), 'start'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3000' },
    shell: true
  })

  nextProcess.stdout.on('data', (data) => console.log(`Next: ${data}`))
  nextProcess.stderr.on('data', (data) => console.error(`Next error: ${data}`))

  // Espera a que el servidor esté listo
  await waitOn({ resources: ['http://localhost:3000'], timeout: 30000 })

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadURL('http://localhost:3000')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (nextProcess) nextProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (nextProcess) nextProcess.kill()
})