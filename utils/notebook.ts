/**
 * Parses a Jupyter Notebook (.ipynb) JSON object into a clean text format.
 * Optimized for LLM ingestion.
 */
export const parseNotebook = (json: any): string => {
    let output = '';
    const cells = json.cells || [];

    cells.forEach((cell: any, index: number) => {
        const type = cell.cell_type;
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';

        if (type === 'markdown') {
            output += `\n# --- Markdown Cell ${index + 1} ---\n${source}\n`;
        } else if (type === 'code') {
            output += `\n# --- Code Cell ${index + 1} ---\n>>> ${source.replace(/\n/g, '\n>>> ')}\n`;

            const outputs = cell.outputs || [];
            outputs.forEach((out: any) => {
                if (out.output_type === 'stream' && out.text) {
                    const text = Array.isArray(out.text) ? out.text.join('') : out.text;
                    output += `${text}\n`;
                } else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
                    const data = out.data || {};
                    if (data['text/plain']) {
                        const text = Array.isArray(data['text/plain']) ? data['text/plain'].join('') : data['text/plain'];
                        output += `${text}\n`;
                    }
                } else if (out.output_type === 'error') {
                    const ename = out.ename || 'Error';
                    const evalue = out.evalue || '';
                    output += `Error: ${ename}: ${evalue}\n`;
                }
            });
        }
    });

    return output.trim();
};
