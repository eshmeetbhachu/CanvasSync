function FullPageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-paper" role="status">
            <span className="size-6 rounded-full border-2 border-olive border-t-transparent animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading</span>
        </div>
    );
}

export default FullPageLoader;
