import { ItemView, WorkspaceLeaf } from "obsidian";
import DeepSeekPlugin from "../main";
import { AnalysisResult } from "./types";

export const VIEW_TYPE_DEEPSEEK = "deepseek-analysis-view";

export class DeepSeekView extends ItemView {
	plugin: DeepSeekPlugin;
	analysisResult?: AnalysisResult;

	constructor(leaf: WorkspaceLeaf, plugin: DeepSeekPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_DEEPSEEK;
	}

	getDisplayText(): string {
		return "DeepSeek Analysis";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// Create main container
		const mainContainer = container.createDiv({
			cls: "deepseek-container",
		});

		// Add filter section
		if (
			this.plugin.settings.enableTagFilters ||
			this.plugin.settings.enableDateFilters ||
			this.plugin.settings.enableTypeFilters
		) {
			this.createFilterSection(mainContainer);
		}

		// Add graph view if enabled
		if (this.plugin.settings.showGraphView) {
			this.createGraphView(mainContainer);
		}

		// Add analysis section
		this.createAnalysisSection(mainContainer);
	}

	private createFilterSection(container: HTMLElement) {
		const filterSection = container.createDiv({ cls: "deepseek-filters" });
		filterSection.createEl("h3", { text: "Filters" });

		if (this.plugin.settings.enableTagFilters) {
			// Add tag filter controls
			const tagFilter = filterSection.createDiv({ cls: "filter-group" });
			tagFilter.createEl("label", { text: "Tags" });
			tagFilter.createEl("input", {
				type: "text",
				placeholder: "Filter by tags...",
			});
		}

		if (this.plugin.settings.enableDateFilters) {
			// Add date filter controls
			const dateFilter = filterSection.createDiv({ cls: "filter-group" });
			dateFilter.createEl("label", { text: "Date Range" });
			dateFilter.createEl("input", { type: "date" });
			dateFilter.createEl("input", { type: "date" });
		}
	}

	private createGraphView(container: HTMLElement) {
		const graphContainer = container.createDiv({ cls: "deepseek-graph" });
		graphContainer.createEl("h3", { text: "Connection Graph" });

		// Create canvas for graph visualization
		const canvas = graphContainer.createEl("canvas", {
			cls: "graph-canvas",
			attr: {
				width: "800",
				height: "600",
			},
		});

		// Initialize graph data
		const nodes = [{ id: "active", label: "Current Note", x: 400, y: 300 }];
		const edges = [];

		// Add linked notes as nodes
		if (this.plugin.settings.maxLinkedNotes > 0 && this.analysisResult) {
			// Position nodes in a circle around center
			const radius = 200;
			for (let i = 0; i < this.plugin.settings.maxLinkedNotes; i++) {
				const angle =
					(2 * Math.PI * i) / this.plugin.settings.maxLinkedNotes;
				const x = 400 + radius * Math.cos(angle);
				const y = 300 + radius * Math.sin(angle);
				nodes.push({
					id: `linked${i}`,
					label: `Linked Note ${i + 1}`,
					x,
					y,
				});
				edges.push({
					from: "active",
					to: `linked${i}`,
					strength: this.analysisResult.connectionStrength
						? this.analysisResult.connectionStrength / 100 // Convert 0-100 to 0-1 range
						: 0.5, // Default strength if not available
				});
			}
		}

		// Draw the graph
		const ctx = canvas.getContext("2d");
		if (ctx) {
			// Set theme colors based on settings
			const isDark =
				this.plugin.settings.graphTheme === "dark" ||
				(this.plugin.settings.graphTheme === "system" &&
					window.matchMedia("(prefers-color-scheme: dark)").matches);

			const colors = {
				background: isDark ? "#1e1e1e" : "#ffffff",
				node: isDark ? "#4a9eff" : "#2196f3",
				edge: isDark ? "#666666" : "#999999",
				text: isDark ? "#ffffff" : "#000000",
			};

			// Clear canvas
			ctx.fillStyle = colors.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw edges
			edges.forEach((edge) => {
				const fromNode = nodes.find((n) => n.id === edge.from);
				const toNode = nodes.find((n) => n.id === edge.to);
				if (fromNode && toNode) {
					ctx.beginPath();
					ctx.strokeStyle = colors.edge;
					ctx.lineWidth = edge.strength * 3;
					ctx.moveTo(fromNode.x, fromNode.y);
					ctx.lineTo(toNode.x, toNode.y);
					ctx.stroke();
				}
			});

			// Draw nodes
			nodes.forEach((node) => {
				// Node circle
				ctx.beginPath();
				ctx.fillStyle = colors.node;
				ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
				ctx.fill();

				// Node label
				ctx.fillStyle = colors.text;
				ctx.font = "12px Arial";
				ctx.textAlign = "center";
				ctx.fillText(node.label, node.x, node.y + 35);
			});
		}
	}

	private createAnalysisSection(container: HTMLElement) {
		const analysisSection = container.createDiv({
			cls: "deepseek-analysis",
		});
		analysisSection.createEl("h3", { text: "Analysis Results" });

		// Create sections for different analysis components
		const summarySection = analysisSection.createDiv({
			cls: "analysis-section",
		});
		summarySection.createEl("h4", { text: "Summary" });
		const summaryContent = summarySection.createDiv({
			cls: "analysis-content",
		});
		summaryContent.createSpan({
			text: this.analysisResult?.summary || "No analysis available",
		});

		const tagsSection = analysisSection.createDiv({
			cls: "analysis-section",
		});
		tagsSection.createEl("h4", { text: "Key Tags" });
		const tagsList = tagsSection.createEl("ul");
		if (this.analysisResult?.tags && this.analysisResult.tags.length > 0) {
			this.analysisResult.tags.forEach((tag) => {
				tagsList.createEl("li", { text: tag });
			});
		} else {
			tagsList.createEl("li", { text: "No tags found" });
		}

		const themesSection = analysisSection.createDiv({
			cls: "analysis-section",
		});
		themesSection.createEl("h4", { text: "Main Themes" });
		const themesList = themesSection.createEl("ul");
		if (
			this.analysisResult?.themes &&
			this.analysisResult.themes.length > 0
		) {
			this.analysisResult.themes.forEach((theme) => {
				themesList.createEl("li", { text: theme });
			});
		} else {
			themesList.createEl("li", { text: "No themes identified" });
		}

		const connectionsSection = analysisSection.createDiv({
			cls: "analysis-section",
		});
		connectionsSection.createEl("h4", { text: "Connection Strength" });
		const strengthIndicator = connectionsSection.createDiv({
			cls: "strength-indicator",
		});
		const strength = this.analysisResult?.connectionStrength || 0;
		strengthIndicator.createSpan({
			text: `${strength}/10`,
			cls: `strength-${Math.floor(strength / 2)}`,
		});
	}
}
