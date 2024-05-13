const vscode = require("vscode");

/**
 * Runs when the extension is loaded
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	context.subscriptions.push(vscode.commands.registerCommand("simple-gist.upload", (fileUri) => {
		generateGistData(fileUri, false);
	}))
	context.subscriptions.push(vscode.commands.registerCommand("simple-gist.secret-upload", (fileUri) => {
		generateGistData(fileUri, true);
	}))
	
}
/**
 * Use the signed in github account to get its token
 * @returns {string} Github access token
 */
async function getGitHubToken() {
    try {
        const session = await vscode.authentication.getSession('github', ['gist'], { createIfNone: true });
        return session.accessToken;
    } catch (error) {
        vscode.window.showErrorMessage('GitHub authentication is required to create a gist.');
    }
}

/**
 * Read from passed in file to gist
 * @param {vscode.Uri} fileUri Provided by the extension
 * @param {boolean} secret If the gist should be uploaded unlisted
 * @returns {void}
 */
async function generateGistData(fileUri, secret) {

	if (!fileUri) {
        vscode.window.showErrorMessage('This command can only be run from the context menu of a file.');
        return;
    }
	try {
		const url = await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Creating Gist",
			cancellable: false
		}, async (progress) => {
			progress.report({ increment: 0, message: 'Uploading...' });

			const token = await getGitHubToken();
		
			const filename = vscode.workspace.asRelativePath(fileUri);
		
			//File content

			const contentAsBytes = await vscode.workspace.fs.readFile(fileUri);
			const content = contentAsBytes.toString();

			const gurl = await createGist(token, filename, content, secret);
			progress.report({ increment: 100, message: 'Done!' });
			return gurl;
		})
		vscode.env.clipboard.writeText(url);
        if(secret) {
            vscode.window.showInformationMessage(`Secret Gist created: [${url}](${url})`, { modal: false, isTrusted: true });
        } else {
		    vscode.window.showInformationMessage(`Gist created: [${url}](${url})`, { modal: false, isTrusted: true });
        }

	} catch (error) {
		console.error(error);
        throw new Error('Failed to generate gist data');
	}
	
	

}
/**
 * Make a gist using the api
 * @param {string} token 
 * @param {string} filename 
 * @param {string} content 
 * @param {boolean} secret 
 * @returns {string} URL of newly created Gist
 */
async function createGist(token, filename, content, secret) {

    const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            files: {
                [filename]: {
                    content: content,
                },
            },
			public: !secret,
        }),
    });

    if (!response.ok) {
        throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const gist = await response.json();
    return gist.html_url;
}


function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
