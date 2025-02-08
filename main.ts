import { Plugin, Notice, TFile } from "obsidian";
import {
	DeepSeekSettings,
	DEFAULT_SETTINGS,
	DeepSeekSettingTab,
} from "./src/settings";
import { AnalysisResult } from "./src/types";

export default class DeepSeekPlugin extends Plugin {
	settings: DeepSeekSettings;
	statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new DeepSeekSettingTab(this.app, this));

		this.addRibbonIcon("search", "Analyze with DeepSeek", () => {
			this.analyzeNotes();
		});

		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.setText("DeepSeek: Ready");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async analyzeNotes() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file to analyze");
			return;
		}

		if (!this.settings.apiKey) {
			new Notice("Please set your DeepSeek API key in settings");
			return;
		}

		try {
			this.statusBarItem.setText("DeepSeek: Analyzing...");

			const content = await this.app.vault.read(activeFile);
			const linkedFiles = await this.getLinkedFiles(activeFile);
			const context = await this.buildAnalysisContext(
				activeFile,
				linkedFiles
			);

			const response = await fetch(
				"https://api.deepseek.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${this.settings.apiKey}`,
					},
					body: JSON.stringify({
						model: this.settings.model,
						messages: [
							{
								role: "system",
								content:
									"You are an advanced note analysis assistant. Analyze the provided notes and their connections to generate insights about relationships, themes, and patterns.",
							},
							{
								role: "user",
								content: `Please analyze these notes and provide a detailed analysis including:
                                    1. A comprehensive summary
                                    2. Key tags and their frequency
                                    3. Important links and connections
                                    4. Emerging themes and trends
                                    5. Connection strength assessment (0-100)
                                    
                                    Main note content:
                                    ${content}
                                    
                                    Related notes and context:
                                    ${context}`,
							},
						],
						temperature: 0.7,
						max_tokens: 2000,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`API Error ${response.status}: ${
						errorData.error?.message || response.statusText
					}`
				);
			}

			const data = await response.json();
			const analysisResult = this.parseAnalysisResult(
				data.choices[0].message.content
			);
			await this.createAnalysisNote(activeFile, analysisResult);

			new Notice("Note analysis completed successfully");
			this.statusBarItem.setText("DeepSeek: Ready");
		} catch (error) {
			console.error("DeepSeek analysis failed:", {
				error,
				message: error.message,
				stack: error.stack,
			});

			new Notice(`Failed to complete analysis: ${error.message}`);
			this.statusBarItem.setText("DeepSeek: Error");
		}
	}

	private async getLinkedFiles(file: TFile): Promise<TFile[]> {
		const links = this.app.metadataCache.resolvedLinks[file.path] || {};
		return Object.keys(links)
			.map((path) => this.app.vault.getAbstractFileByPath(path))
			.filter((file): file is TFile => file instanceof TFile);
	}

	private async buildAnalysisContext(
		mainFile: TFile,
		linkedFiles: TFile[]
	): Promise<string> {
		let context = "";
		for (const file of linkedFiles.slice(0, 5)) {
			// Limit to 5 linked files
			const content = await this.app.vault.read(file);
			context += `\nLinked note (${file.basename}):\n${content.slice(
				0,
				500
			)}...\n`;
		}
		return context;
	}

	private parseAnalysisResult(content: string): AnalysisResult {
		// Basic parsing - in reality, you'd want more robust parsing
		return {
			summary: content,
			tags: [],
			links: [],
			themes: [],
			connectionStrength: 0,
		};
	}

	private async createAnalysisNote(
		sourceFile: TFile,
		analysis: AnalysisResult
	) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const newFileName = `Analysis - ${sourceFile.basename} ${timestamp}.md`;

		const content = `# Analysis of ${sourceFile.basename}
		
## Summary
${analysis.summary}

## Key Tags
${analysis.tags?.join(", ")}

## Important Links
${analysis.links?.join("\n")}

## Emerging Themes
${analysis.themes?.join("\n")}

## Connection Strength
${analysis.connectionStrength}/100

---
Analysis generated by DeepSeek AI at ${new Date().toLocaleString()}
`;

		await this.app.vault.create(newFileName, content);
	}
}
