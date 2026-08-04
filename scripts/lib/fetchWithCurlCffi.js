import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PY_SCRIPT = path.join(__dirname, 'curl_cffi_fetch.py');

export async function fetchHtmlViaCurlCffi(url) {
    try {
        const { stdout } = await execFileAsync(
            'python3',
            [PY_SCRIPT, url],
            {
                maxBuffer: 1024 * 1024 * 50,
                encoding: 'utf8',
            }
        );
        return stdout;
    } catch (err) {
        const stderrMsg = err.stderr ? err.stderr.trim() : err.message;
        throw new Error(`curl_cffi fetch 실패 (${url}):\n${stderrMsg}`);
    }
}
