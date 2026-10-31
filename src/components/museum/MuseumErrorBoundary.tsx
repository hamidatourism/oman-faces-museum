import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

interface MuseumErrorBoundaryProps {
  children: ReactNode;
}

interface MuseumErrorBoundaryState {
  hasError: boolean;
}

export default class MuseumErrorBoundary extends Component<MuseumErrorBoundaryProps, MuseumErrorBoundaryState> {
  state: MuseumErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MuseumErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The 3D museum scene failed to start', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        dir="rtl"
        lang="ar"
        className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-lg flex-col gap-4 rounded-2xl border border-[#c9a24d]/50 bg-[#1d1610] p-5 text-[#f3e9d2] shadow-2xl sm:flex-row sm:items-center"
      >
        <TriangleAlert className="h-6 w-6 shrink-0 text-[#e7c27a]" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">تعذّر تشغيل المشهد ثلاثي الأبعاد</p>
          <p className="mt-1 text-sm leading-[1.7] text-[#e7c27a]">
            تأكد من تفعيل تسريع الرسومات في المتصفح، ثم أعد المحاولة.
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleRetry}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#c9a24d] px-4 py-2 text-sm font-semibold text-[#1d1610] transition hover:bg-[#dcb866]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          إعادة المحاولة
        </button>
      </div>
    );
  }
}
