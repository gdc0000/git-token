import React, { useState, useCallback } from 'react';
import { FileText, Download, RotateCcw, CheckCircle2, Upload, Terminal } from 'lucide-react';

interface NotebookConverterProps {
    onBack?: () => void;
}

export const NotebookConverter: React.FC<NotebookConverterProps> = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionResult, setConversionResult] = useState<string | null>(null);
    const [preview, setPreview] = useState<string>('');

    const parseNotebook = (json: any): string => {
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.name.endsWith('.ipynb')) {
            setFile(selectedFile);
            handleConvert(selectedFile);
        } else if (selectedFile) {
            alert('Please upload a .ipynb file');
        }
    };

    const handleConvert = async (fileToConvert: File) => {
        setIsConverting(true);
        try {
            const text = await fileToConvert.text();
            const json = JSON.parse(text);
            const converted = parseNotebook(json);
            setConversionResult(converted);
            setPreview(converted.slice(0, 500));
        } catch (err) {
            console.error(err);
            alert('Error parsing notebook. Ensure it is a valid .ipynb file.');
        } finally {
            setIsConverting(false);
        }
    };

    const downloadFile = () => {
        if (!conversionResult || !file) return;
        const blob = new Blob([conversionResult], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.ipynb', '.txt');
        a.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setConversionResult(null);
        setPreview('');
    };

    if (!conversionResult) {
        return (
            <div className="w-full max-w-2xl mx-auto p-12 rounded-[2rem] bg-card/50 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary mb-6 shadow-inner">
                        <Terminal className="h-10 w-10" />
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-4">
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Notebook to Text
                        </span>
                        <br />
                        <span className="text-foreground">Converter</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                        Turn any Jupyter Notebook into a clean text digest. Optimized for LLM context.
                    </p>
                </div>

                <div className="relative group">
                    <input
                        type="file"
                        accept=".ipynb"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-primary/20 group-hover:border-primary/50 transition-all duration-300 rounded-[1.5rem] p-16 flex flex-col items-center justify-center gap-6 bg-primary/5 group-hover:bg-primary/10 hover:scale-[1.01]">
                        <div className="p-5 rounded-full bg-background shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold mb-1">Upload .ipynb</p>
                            <p className="text-muted-foreground">Click or drag and drop your notebook file</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-50 mb-4">Inspired by</p>
                    <a href="https://gitingest.com" target="_blank" className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors group">
                        <span className="bg-muted px-3 py-1 rounded-full group-hover:bg-primary/10 transition-colors">Gitingest</span>
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-12 rounded-[2rem] bg-card/50 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center mb-12">
                <div className="bg-primary/10 text-primary px-6 py-2.5 rounded-full flex items-center gap-3 mb-8 border border-primary/20 shadow-sm">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-bold tracking-wide">{file?.name}</span>
                </div>

                <div className="flex items-center gap-4 text-green-500 font-black text-3xl mb-6">
                    <div className="p-2 rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <span>Conversion Complete!</span>
                </div>

                <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden mb-12 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000 w-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    <button
                        onClick={downloadFile}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-5 px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-green-500/20 text-lg"
                    >
                        <Download className="h-6 w-6" />
                        Download Text File
                    </button>
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-800 text-white font-bold py-5 px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-500/20 text-lg"
                    >
                        <RotateCcw className="h-6 w-6" />
                        Convert Another
                    </button>
                </div>
            </div>

            <div className="mt-12 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Preview (first 500 chars)</p>
                    <span className="text-xs text-muted-foreground opacity-60">Ready for LLM ingestion</span>
                </div>
                <div className="bg-muted/30 rounded-[1.5rem] p-8 font-mono text-sm leading-relaxed border border-white/5 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/20 pointer-events-none" />
                    <pre className="whitespace-pre-wrap break-all opacity-90 text-foreground/80">
                        {preview}...
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-background/80 backdrop-blur px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter border border-white/10">Markdown + Code</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
