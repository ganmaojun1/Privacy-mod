import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		"extension.togglePrivacyMode",
		() => {
			// 切换隐私模式
			PrivacyMode.toggle();
		}
	);

	let switchModeDisposable = vscode.commands.registerCommand(
		"extension.switchPrivacyMode",
		() => {
			PrivacyMode.switchMode();
		}
	);

	context.subscriptions.push(disposable);

	context.subscriptions.push(switchModeDisposable);
}

class PrivacyMode {
	private static enabled: boolean = false;
	private static decoration: vscode.TextEditorDecorationType;
	private static disposable: vscode.Disposable | undefined;
	private static debounceTimer: NodeJS.Timeout | undefined;
	private static mode: "opacity" | "blur" = "opacity";

	static toggle() {
		this.enabled = !this.enabled;
		if (this.enabled) {
			this.enable();
		} else {
			this.disable();
		}
	}

	static switchMode() {
		this.mode = this.mode === "opacity" ? "blur" : "opacity";
		if (this.enabled) {
			this.disable();
			this.enable();
		}
	}

	private static enable() {
		// 创建装饰类型
		this.decoration = vscode.window.createTextEditorDecorationType({
			...(this.mode === "opacity"
				? { opacity: "0.1" }
				: { textDecoration: "none; filter: blur(5px);" }),
			isWholeLine: true,
		});

		// 应用装饰
		this.updateDecorations();

		// 监听光标移动事件，使用防抖
		this.disposable = vscode.window.onDidChangeTextEditorSelection(
			this.debouncedUpdateDecorations
		);
	}

	private static disable() {
		if (this.decoration) {
			this.decoration.dispose();
		}
		if (this.disposable) {
			this.disposable.dispose();
		}
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}

	private static debouncedUpdateDecorations = () => {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.updateDecorations();
		}, 100); // 100毫秒的防抖延迟
	};

	private static updateDecorations() {
		const editor = vscode.window.activeTextEditor;
		if (!editor || !PrivacyMode.enabled) {
			return;
		}

		const cursorLine = editor.selection.active.line;
		const visibleRange = editor.visibleRanges[0];
		const startLine = visibleRange.start.line;
		const endLine = visibleRange.end.line;
		const ranges: vscode.Range[] = [];

		for (let i = startLine; i <= endLine; i++) {
			if (i !== cursorLine) {
				ranges.push(new vscode.Range(i, 0, i, Number.MAX_VALUE));
			}
		}

		editor.setDecorations(PrivacyMode.decoration, ranges);
	}
}

export function deactivate() { }