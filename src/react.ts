/** Render an existing React element inside a template. React is an optional peer dependency. */
export function renderReact(element: unknown, options: { hydrate?: boolean } = {}): string {
	let server: {
		renderToStaticMarkup(node: unknown): string;
		renderToString(node: unknown): string;
	};
	try {
		server = require("react-dom/server");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "MODULE_NOT_FOUND") {
			throw new Error("React rendering requires react and react-dom to be installed.", { cause: error });
		}
		throw error;
	}
	return options.hydrate ? server.renderToString(element) : server.renderToStaticMarkup(element);
}
