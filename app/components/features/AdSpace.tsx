export default function AdSpace({ label = "Advertisement", orientation = "vertical" }: { label?: string, orientation?: "vertical" | "horizontal" }) {
    if (orientation === "horizontal") {
        return (
            <div className="w-full h-24 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center rounded my-4">
                {label}
            </div>
        );
    }

    return (
        <div className="w-40 h-[600px] bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center p-4 sticky top-20 rounded">
            <div className="rotate-90 whitespace-nowrap">{label}</div>
        </div>
    );
}
