import * as vscode from 'vscode';
const { spawn } = require('child_process');
const { window, Uri, workspace } = require('vscode');

export function activate(context: vscode.ExtensionContext) {
	const diffToolSetting = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
	if (diffToolSetting) {
		vscode.workspace.getConfiguration().update('openindifftool.diffTool', 'WinMergeU.exe', vscode.ConfigurationTarget.Global);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('openindifftool.GetDiff', fileDiff),
	);
}

async function fileDiff(e: vscode.Uri, list?: vscode.Uri[]) {
	let leftPath, rightPath;
	if (list && list.length > 1) {
		if (list.length > 2) {
			vscode.window.showErrorMessage('Comparison of more than 2 files is not supported.');
			return;
		}
		[leftPath, rightPath] = list.map((p) => p.fsPath);
	}

	if (leftPath && rightPath) {
		const diffToolPath: string | undefined = workspace.getConfiguration().get('openindifftool.diffTool');

		if (diffToolPath) {
			const diffProcess = spawn(diffToolPath, [leftPath, rightPath]);
			diffProcess.on('error', (err: { message: any; }) => {
				console.error('Failed to start the diff tool:', err);
				window.showErrorMessage(`Failed to start the diff tool: ${err.message}`);
			});
		} else {
			window.showErrorMessage('Diff tool path is not specified in the settings.');
		}
	}
}

export function deactivate() { }
