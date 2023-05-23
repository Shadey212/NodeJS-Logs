const socket = io();
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const statusText = document.getElementById('status');
const spinner = document.getElementById('spinner');
const logCounter = document.createElement('p');

logCounter.id = 'logCounter';
logCounter.style.fontSize = '1.2em';
statusText.after(logCounter);

let logsGenerated = 0; // Track the number of logs generated

startButton.addEventListener('click', () => {
    socket.emit('start');
    statusText.innerText = 'Generating Logs...';
    spinner.style.display = 'inline-block';
});

stopButton.addEventListener('click', () => {
    socket.emit('stop');
    spinner.style.display = 'none';
    // Display the final log count when stopping
    statusText.innerText = `Stopped generating logs. Total Logs Generated: ${logsGenerated}`;
});

socket.on('log', () => {
    logsGenerated += 1; // Increment the log count
    logCounter.innerText = `Logs Generated: ${logsGenerated}`;
});