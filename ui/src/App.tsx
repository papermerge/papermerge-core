import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'styles/globals.scss';

import React, { useState, useEffect } from 'react';
import SpecialFolder from "components/special_folder";
import Tags from "components/tags/table"
import Layout from 'components/layout';
import { useMe } from 'hooks/me';
import { AppContentBlockEnum } from 'types';
import SearchResults from 'components/search/search_results';


import 'App.css';


function App() {
  const { data, error, is_loading } = useMe();
  const [contentBlockItem, setContentBlockItem] = useState<AppContentBlockEnum>(AppContentBlockEnum.home);
  const [searchQuery, setSearchQuery] = useState<string>('');

  let content_block: JSX.Element;

  const onContentBlockChange = (item: AppContentBlockEnum) => {
    setContentBlockItem(item);
  }

  const onSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setContentBlockItem(AppContentBlockEnum.search_results);
  }

  useEffect(() => {
    content_block = <SearchResults query={searchQuery} />;
    console.log(`content block updated with ${searchQuery}`);
  }, [searchQuery]);

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
    content_block = <SpecialFolder special_folder_id={ data?.home_folder_id } />;
  } else if (contentBlockItem == AppContentBlockEnum.inbox) {
    content_block = <SpecialFolder special_folder_id={ data?.inbox_folder_id } />;
  } else if (contentBlockItem == AppContentBlockEnum.tags) {
    content_block = <Tags />;
  } else {
    content_block = <SearchResults query={searchQuery} />
  }

  return (
    <Layout
      onContentBlockChange={onContentBlockChange}
      onSearchSubmit={onSearchSubmit}>
      {content_block}
    </Layout>
  );
}

export default App;
