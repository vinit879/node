const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

// Define paths for streams and logs on the desktop
const streamsPath = "/home/vctech/Desktop/live-stream-app/streams";
const logsPath = "/home/vctech/Desktop/live-stream-app/logs";

// Ensure streams and logs folders exist
if (!fs.existsSync(streamsPath)) {
    fs.mkdirSync(streamsPath, { recursive: true });
}
if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
}

// FFmpeg path and RTSP configuration
const ffmpegPath = "ffmpeg"; // Update this if FFmpeg is installed in a different location
const channels = [
    { channel: 102, ip: "10.11.12.21" },
    { channel: 202, ip: "10.11.12.21" },
    { channel: 302, ip: "10.11.12.21" },
    { channel: 402, ip: "10.11.12.21" },
    { channel: 502, ip: "10.11.12.21" },
    { channel: 602, ip: "10.11.12.21" },
    { channel: 702, ip: "10.11.12.21" },
    { channel: 802, ip: "10.11.12.21" },
    { channel: 902, ip: "10.11.12.21" },
    { channel: 1002, ip: "10.11.12.21" },
    { channel: 1102, ip: "10.11.12.21" },
    { channel: 1202, ip: "10.11.12.21" },
    { channel: 1302, ip: "10.11.12.21" },
    { channel: 1402, ip: "10.11.12.21" },
    { channel: 1502, ip: "10.11.12.21" },
    { channel: 1602, ip: "10.11.12.21" },
];

// Start FFmpeg processes for all streams
channels.forEach(({ channel, ip }) => {
    const rtspUrl = `rtsp://admin:vct280620@${ip}:1024/Streaming/Channels/${channel}`;
    const outputPath = `${streamsPath}/stream${channel}.m3u8`;
    const logFile = `${logsPath}/stream${channel}_ffmpeg.log`;

    // FFmpeg command
    const ffmpegCommand = `${ffmpegPath} -loglevel verbose -rtsp_transport tcp -max_delay 5000000 -i "${rtspUrl}" -r 15 -vcodec hevc_cuvid -c:v libx264 -preset ultrafast -an -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments "${outputPath}"`;

    console.log(`Starting FFmpeg for channel ${channel}...`);

    const childProcess = exec(ffmpegCommand);

    // Log FFmpeg output to a file
    const logFileStream = fs.createWriteStream(logFile, { flags: "a" });
    childProcess.stdout.pipe(logFileStream);
    childProcess.stderr.pipe(logFileStream);

    childProcess.on("close", (code) => {
        console.log(`FFmpeg process for stream ${channel} exited with code ${code}`);
    });

    childProcess.on("error", (err) => {
        console.error(`Error with FFmpeg process for stream ${channel}:`, err);
    });
});

// Serve static HLS files
app.use("/streams", express.static(streamsPath));

// All streams page
app.get("/all-streams", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>All Streams</title>
            <script src="https://cdn.jsdelivr.net/npm/hls.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f9; }
                h1 { text-align: center; margin: 20px 0; }
                .container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
                .stream { background: white; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
                video { width: 100%; height: auto; border: 1px solid black; }
            </style>
        </head>
        <body>
            <h1>All Streams</h1>
            <div class="container">
                ${channels
                    .map(
                        ({ channel }) => `
                        <div class="stream">
                            <h3>Stream ${channel}</h3>
                            <video id="stream${channel}" controls autoplay muted></video>
                            <script>
                                if (Hls.isSupported()) {
                                    const hls = new Hls();
                                    hls.loadSource('/streams/stream${channel}.m3u8');
                                    hls.attachMedia(document.getElementById('stream${channel}'));
                                } else {
                                    document.getElementById('stream${channel}').src = '/streams/stream${channel}.m3u8';
                                }
                            </script>
                        </div>
                    `
                    )
                    .join("")}
            </div>
        </body>
        </html>
    `);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/all-streams`);
});

