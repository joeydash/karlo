import { useEffect } from "react";
import useTagStore from "../stores/tagStore";
import { useOrganization } from "./useOrganization";

export const useTag = () => {
  const tagStore = useTagStore();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      tagStore.fetchTags(currentOrganization.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization?.id]);

  return {
    ...tagStore,
    fetchTags: tagStore.fetchTags,
    createTag: tagStore.createTag,
    updateTag: tagStore.updateTag,
    deleteTag: tagStore.deleteTag,
  };
};
