const { exec } = require('child_process');
const fs = require('fs');

module.exports = async (req, res) => {
    const { channel } = req.query;
    if (!channel) {
        return res.status(400).json({ error: 'Channel parameter is required.' });
    }

    // Define paths
    const streamsPath = '/tmp/streams';  // Temporary path in Vercel environment
    const logsPath = '/tmp/logs';        // Temporary logs path
    const ffmpegPath = 'ffmpeg';         // FFmpeg command

    // Ensure temporary directories exist
    if (!fs.existsSync(streamsPath)) {
        fs.mkdirSync(streamsPath, { recursive: true });
    }
    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
    }

    // RTSP URL configuration (adjust IP and ports accordingly)
    const ip = '10.11.12.21';  // Replace with correct IP or make dynamic
    const rtspUrl = `rtsp://admin:vct280620@${ip}:1024/Streaming/Channels/${channel}`;
    const outputPath = `${streamsPath}/stream${channel}.m3u8`;
    const logFile = `${logsPath}/stream${channel}_ffmpeg.log`;

    // FFmpeg command
    const ffmpegCommand = `${ffmpegPath} -loglevel verbose -rtsp_transport tcp -max_delay 5000000 -i "${rtspUrl}" -r 15 -vcodec hevc_cuvid -c:v libx264 -preset ultrafast -an -f hls -hls_time 2 -hls_list_size 3 -hls_flags delete_segments "${outputPath}"`;

    // Execute FFmpeg
    const childProcess = exec(ffmpegCommand);

    // Log FFmpeg output to a file
    const logFileStream = fs.createWriteStream(logFile, { flags: 'a' });
    childProcess.stdout.pipe(logFileStream);
    childProcess.stderr.pipe(logFileStream);

    childProcess.on('close', (code) => {
        console.log(`FFmpeg process for stream ${channel} exited with code ${code}`);
    });

    childProcess.on('error', (err) => {
        console.error(`Error with FFmpeg process for stream ${channel}:`, err);
    });

    // Respond with success message
    res.status(200).json({ message: `Started FFmpeg for channel ${channel}...` });
};

