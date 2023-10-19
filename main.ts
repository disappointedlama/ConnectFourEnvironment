import { app, BrowserWindow } from 'electron'

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        //fullscreen:true,
        //resizable:false,
        title:'ConnectFourEnvironment',
        icon:'./static/images/Connect_four_game.png',
        webPreferences:{
            devTools:true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    })
    win.setMenu(null)
    win.loadFile('index.html').then(()=>{
        win.webContents.openDevTools()
    }).then(()=>{
        win.maximize();
    })
}
app.whenReady().then(() => {
    createWindow()
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})