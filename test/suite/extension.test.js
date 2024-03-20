const assert = require('assert');
const vscode = require('vscode');
const { activate } = require('../../extension');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
	//TODO; Add more tests
    test('Extension loads properly', async () => {
		await activate({ subscriptions: [] });

		assert.ok(vscode.extensions.getExtension('ArcticWarmth.simple-gist').isActive)
    });
});