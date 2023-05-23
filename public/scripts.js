const socket = io();
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const statusText = document.getElementById('status');
const spinner = document.getElementById('spinner');
const logCounter = document.createElement('p');

logCounter.id = 'logCounter';
logCounter.style.fontSize = '1.2em';
statusText.after(logCounter);

startButton.addEventListener('click', () => {
    socket.emit('start');
    statusText.innerText = 'Generating Logs...';
    spinner.style.display = 'inline-block';
});

stopButton.addEventListener('click', () => {
    socket.emit('stop');
    spinner.style.display = 'none';
    // Get the current log count when stopping
    const count = logCounter.innerText.split(': ')[1];
    statusText.innerText = `Stopped generating logs. Total logs generated: ${count}`;
});

socket.on('log', (count) => {
    logCounter.innerText = `Logs Generated: ${count}`;
});