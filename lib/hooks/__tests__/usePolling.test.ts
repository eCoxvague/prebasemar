import { renderHook, waitFor, act } from '@testing-library/react';
import { usePolling } from '../usePolling';

// Mock timers
jest.useFakeTimers();

describe('usePolling', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should fetch data on mount', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
            })
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.data).toEqual({ data: 'test' });
        });

        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(result.current.isLoading).toBe(false);
    });

    it('should poll at specified interval', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
            })
        );

        // Initial fetch
        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        // Advance timer by 1 second
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalledTimes(2);
        });

        // Advance timer by another second
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalledTimes(3);
        });
    });

    it('should not fetch when enabled is false', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                enabled: false,
            })
        );

        // Wait a bit
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
        const error = new Error('Fetch failed');
        const fetchFn = jest.fn().mockRejectedValue(error);
        const onError = jest.fn();

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                onError,
            })
        );

        await waitFor(() => {
            expect(result.current.error).toEqual(error);
        });

        expect(onError).toHaveBeenCalledWith(error);
    });

    it('should call onSuccess callback', async () => {
        const data = { data: 'test' };
        const fetchFn = jest.fn().mockResolvedValue(data);
        const onSuccess = jest.fn();

        renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                onSuccess,
            })
        );

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(data);
        });
    });

    it('should allow manual refetch', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 10000, // Long interval
                fetchOnMount: false,
            })
        );

        expect(fetchFn).not.toHaveBeenCalled();

        // Manual refetch
        await act(async () => {
            await result.current.refetch();
        });

        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when stop is called', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
            })
        );

        // Wait for initial fetch
        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        // Stop polling
        act(() => {
            result.current.stop();
        });

        expect(result.current.isPolling).toBe(false);

        // Advance timer
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Should not have called fetch again
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should start polling when start is called', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                enabled: false,
                fetchOnMount: false,
            })
        );

        expect(result.current.isPolling).toBe(false);

        // Start polling
        act(() => {
            result.current.start();
        });

        await waitFor(() => {
            expect(result.current.isPolling).toBe(true);
        });

        // Advance timer to trigger fetch
        act(() => {
            jest.advanceTimersByTime(100);
        });

        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalled();
        });
    });

    it('should update lastUpdate timestamp', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
            })
        );

        expect(result.current.lastUpdate).toBeNull();

        await waitFor(() => {
            expect(result.current.lastUpdate).toBeInstanceOf(Date);
        });
    });

    it('should cleanup on unmount', async () => {
        const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

        const { unmount } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
            })
        );

        await waitFor(() => {
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        unmount();

        // Advance timer after unmount
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Should not have called fetch again after unmount
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should continue polling on error when continueOnError is true', async () => {
        const fetchFn = jest
            .fn()
            .mockRejectedValueOnce(new Error('First error'))
            .mockResolvedValueOnce({ data: 'success' });

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                continueOnError: true,
            })
        );

        // Wait for first error
        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        // Advance timer
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Should have retried and succeeded
        await waitFor(() => {
            expect(result.current.data).toEqual({ data: 'success' });
            expect(result.current.error).toBeNull();
        });
    });

    it('should stop polling on error when continueOnError is false', async () => {
        const fetchFn = jest.fn().mockRejectedValue(new Error('Error'));

        const { result } = renderHook(() =>
            usePolling({
                fetchFn,
                interval: 1000,
                continueOnError: false,
            })
        );

        // Wait for error
        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });

        expect(result.current.isPolling).toBe(false);

        // Advance timer
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Should not have retried
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });
});
