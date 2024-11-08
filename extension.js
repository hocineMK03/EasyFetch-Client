
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const easyfetch = require('@hocinemk/easyfetch');

function getWebviewContent(context, panel) {
    const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
    
    const cssPath = path.join(context.extensionPath, 'src', 'webview', 'index.css');
    const jsPath = path.join(context.extensionPath, 'src', 'webview', 'index.js');
    
    // Convert the CSS and JS file paths to VS Code webview URIs
    const cssUri = panel.webview.asWebviewUri(vscode.Uri.file(cssPath));
    const jsUri = panel.webview.asWebviewUri(vscode.Uri.file(jsPath));
    
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace the CSS link with the webview URI
    html = html.replace('href="index.css"', `href="${cssUri}"`);
    
    // Inject the JS file by adding a <script> tag before closing </body> tag
    html = html.replace('</body>', `<script src="${jsUri}"></script></body>`);
    
    return html;
}
async function activate(context) {
	
    const disposable = vscode.commands.registerCommand('easyfetch-client.EasyFetch', () => {
        const panel = vscode.window.createWebviewPanel(
            'apiTester', // Identifies the type of the webview.
            'API Tester', // Title of the panel displayed to the user.
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true // Allows JavaScript in the webview
            }
        );

        panel.webview.html = getWebviewContent(context,panel);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'makeRequest':
                        try {
                            const { url, method,headers, body } = message.payload;

                           
                            const response = await easyfetch( {
                                url,
                                headers: headers || {}, // If headers are null or undefined, use an empty object.
                                method: method, // If headers are null or undefined, use an empty object.
                                body: method !== 'GET' ? body : undefined  // Include body only for methods other than GET.
                            });
                            console.log(response) 
                            let headerObj = {};
                            if(response.headers){
                                response.headers.forEach((value, key) => {
                                    headerObj[key] = value;
                                });
                            }
                            else{
                                headerObj=undefined
                            }
                            let set_cookies=response.set_cookies
                            // Send response back to webview
                            panel.webview.postMessage({
                                command: 'requestResponse',
                                payload: {
                                    status: response.status,
                                    statusText: response.statusCode,
                                    headers: headerObj,
                                    set_cookies:set_cookies,
                                    body: response.data,
                                    time: response.time
                                }
                            });
                        } catch (error) {
                            panel.webview.postMessage({
                                command: 'requestError',
                                payload: {
                                    error: error.message
                                }
                            });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

    });
    
    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};


