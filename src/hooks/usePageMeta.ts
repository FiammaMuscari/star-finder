import { useEffect } from "react";

type PageMeta = {
  title: string;
  description: string;
};

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const previousDescription = metaDescription?.content ?? "";

    document.title = title;

    if (metaDescription) {
      metaDescription.content = description;
    }

    return () => {
      document.title = previousTitle;

      if (metaDescription) {
        metaDescription.content = previousDescription;
      }
    };
  }, [description, title]);
}
