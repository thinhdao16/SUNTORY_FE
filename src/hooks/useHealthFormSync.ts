import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";

export function useHealthFormSync<T extends object>(
    zustandData: T,
    setZustandData: (data: Partial<T>) => void,
    deps: any[] = []
) {
    const form = useForm<T>({ defaultValues: zustandData as import("react-hook-form").DefaultValues<T> });
    const debouncedSet = useRef(
        debounce((data: Partial<T>) => setZustandData({ ...data }), 300)
    ).current;
    const prevValues = useRef<T>(zustandData);

    useEffect(() => {
        const subscription = form.watch((value) => {
            const prev = prevValues.current;
            if (JSON.stringify(prev) !== JSON.stringify(value)) {
                prevValues.current = value as T;
                debouncedSet(value);
            }
        });
        return () => {
            subscription.unsubscribe();
            debouncedSet.cancel();
        };
    }, [form.watch, debouncedSet]);

    useEffect(() => {
        form.reset(zustandData);
    }, [form.reset, ...deps]);

    return form;
}