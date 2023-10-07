import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'styles/globals.scss';

import React, { useState, useEffect } from 'react';
import DualPanel from "components/dual-panel/DualPanel";
import Tags from "components/tags/table"
import Layout from 'components/layout';
import { useMe } from 'hooks/me';
import { AppContentBlockEnum, CType } from 'types';
import SearchResults from 'components/search/search_results';


import 'App.css';


function App() {
  const { data, error, is_loading } = useMe();
  const [contentBlockItem, setContentBlockItem] = useState<AppContentBlockEnum>(AppContentBlockEnum.home);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nodeId, setNodeId] = useState<string|null>(null);
  const [nodeType, setNodeType] = useState<CType>('folder');
  const [pageNumber, setPageNumber] = useState<number|null>();
  const [contentBlock, setContentBlock] = useState<JSX.Element>();

  let content_block: JSX.Element;

  const onContentBlockChange = (item: AppContentBlockEnum) => {
    if (item == AppContentBlockEnum.home) {
      setNodeType('folder');
      if (data?.home_folder_id) {
        setNodeId(data?.home_folder_id);
      }
    }

    if (item == AppContentBlockEnum.inbox) {
      setNodeType('folder');
      if (data?.inbox_folder_id) {
        setNodeId(data?.inbox_folder_id);
      }
    }

    setContentBlockItem(item);
  }

  const onSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setContentBlockItem(AppContentBlockEnum.search_results);
  }

  const onSearchResultClick = (
    node_id: string,
    node_type: CType,
    page_number: number | null
  ) => {
    console.log(`new node_type ${node_type}`);
    setNodeId(node_id);
    setContentBlockItem(AppContentBlockEnum.home);
    setNodeType(node_type);
    setPageNumber(page_number);
  }

  if (is_loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error</div>
  }

  if (!data?.home_folder_id) {
    return <div>User does not have home folder</div>;
  }

  if (contentBlockItem == AppContentBlockEnum.home) {
    content_block = <DualPanel
      special_folder_id={ nodeId || data?.home_folder_id }
      special_node_type={nodeType} />;
  } else if (contentBlockItem == AppContentBlockEnum.inbox) {
    content_block = <DualPanel
      special_folder_id={ data?.inbox_folder_id }
      special_node_type={nodeType} />;
  } else if (contentBlockItem == AppContentBlockEnum.tags) {
    content_block = <Tags />;
  } else {
    content_block = <SearchResults query={searchQuery} onSearchResultClick={onSearchResultClick} />
  }

  return <Layout
            onContentBlockChange={onContentBlockChange}
            onSearchSubmit={onSearchSubmit}>
              {content_block}
        </Layout>
}

export default App;
