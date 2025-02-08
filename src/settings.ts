import { App, PluginSettingTab, Setting } from "obsidian";
import DeepSeekPlugin from "../main";

export interface DeepSeekSettings {
    apiKey: string;
    model: string;
    // Analysis settings
    maxLinkedNotes: number;
    includeSubfolders: boolean;
    analysisDepth: "basic" | "detailed" | "comprehensive";
    // Graph settings
    showGraphView: boolean;
    graphTheme: "light" | "dark" | "system";
    graphLayout: "force" | "circular" | "hierarchical";
    // Filter settings
    enableTagFilters: boolean;
    enableDateFilters: boolean;
    enableTypeFilters: boolean;
    // Output settings
    createAnalysisFile: boolean;
    analysisTemplate: string;
}

export const DEFAULT_SETTINGS: DeepSeekSettings = {
    apiKey: "",
    model: "deepseek-chat",
    maxLinkedNotes: 5,
    includeSubfolders: false,
    analysisDepth: "detailed",
    showGraphView: true,
    graphTheme: "system",
    graphLayout: "force",
    enableTagFilters: true,
    enableDateFilters: true,
    enableTypeFilters: true,
    createAnalysisFile: true,
    analysisTemplate: "default",
}

export class DeepSeekSettingTab extends PluginSettingTab {
    plugin: DeepSeekPlugin;

    constructor(app: App, plugin: DeepSeekPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // API Settings
        containerEl.createEl('h3', { text: 'API Settings' });
        
        new Setting(containerEl)
            .setName("API Key")
            .setDesc("Enter your DeepSeek API key")
            .addText(text => text
                .setPlaceholder("Enter your API key")
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Model")
            .setDesc("Choose DeepSeek model")
            .addDropdown(dropdown => dropdown
                .addOption("deepseek-chat", "DeepSeek Chat")
                .addOption("deepseek-coder", "DeepSeek Coder")
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        // Analysis Settings
        containerEl.createEl('h3', { text: 'Analysis Settings' });

        new Setting(containerEl)
            .setName("Maximum Linked Notes")
            .setDesc("Maximum number of linked notes to include in analysis")
            .addSlider(slider => slider
                .setLimits(1, 20, 1)
                .setValue(this.plugin.settings.maxLinkedNotes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxLinkedNotes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Include Subfolders")
            .setDesc("Include notes from subfolders in analysis")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.includeSubfolders)
                .onChange(async (value) => {
                    this.plugin.settings.includeSubfolders = value;
                    await this.plugin.saveSettings();
                }));

        // Graph View Settings
        containerEl.createEl('h3', { text: 'Graph View Settings' });

        new Setting(containerEl)
            .setName("Show Graph View")
            .setDesc("Enable or disable the graph view")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showGraphView)
                .onChange(async (value) => {
                    this.plugin.settings.showGraphView = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Graph Theme")
            .setDesc("Choose the graph view theme")
            .addDropdown(dropdown => dropdown
                .addOption("light", "Light")
                .addOption("dark", "Dark")
                .addOption("system", "System")
                .setValue(this.plugin.settings.graphTheme)
                .onChange(async (value) => {
                    this.plugin.settings.graphTheme = value as "light" | "dark" | "system";
                    await this.plugin.saveSettings();
                }));

        // Filter Settings
        containerEl.createEl('h3', { text: 'Filter Settings' });

        new Setting(containerEl)
            .setName("Enable Tag Filters")
            .setDesc("Allow filtering by tags")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableTagFilters)
                .onChange(async (value) => {
                    this.plugin.settings.enableTagFilters = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Enable Date Filters")
            .setDesc("Allow filtering by date")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDateFilters)
                .onChange(async (value) => {
                    this.plugin.settings.enableDateFilters = value;
                    await this.plugin.saveSettings();
                }));
    }
} 