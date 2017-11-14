// @flow
const electron = window.require('electron');
export const ipcRenderer = electron.ipcRenderer;

// Add a send async function for await async
ipcRenderer.sendAsync = (channel: string, ...args?: any) => {
  return new Promise((resolve) => {
    ipcRenderer.once(channel, (event, result) => {
      resolve(result);
    });
    ipcRenderer.send(channel, ...args);
  });
};

export default electron;