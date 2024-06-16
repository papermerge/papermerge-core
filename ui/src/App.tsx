import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'styles/globals.scss';

import React, { useState } from 'react';
import DualPanel from "components/dual-panel/DualPanel";
import Tags from "components/tags/table";
import Users from "components/users/table";
import Groups from "components/groups/table";
import Layout from 'components/layout';
import { useResource } from 'hooks/resource';
import { AppContentBlockEnum, CType, NType, User, Pagination } from 'types';
import SearchResults from 'components/search/search_results';


import 'App.css';
import SessionEnd from 'components/SessionEnded';


function App() {
  const user = useResource<User>('/api/users/me');
  const [contentBlockItem, setContentBlockItem] = useState<AppContentBlockEnum>(AppContentBlockEnum.home);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [node, setNode] = useState<NType|null>(null);

  let content_block: JSX.Element;

  const onContentBlockChange = (item: AppContentBlockEnum) => {

    if (item == AppContentBlockEnum.home) {
      if (user.data?.home_folder_id) {
        setNode({
          id: user.data?.home_folder_id,
          ctype: 'folder'
        });
      }
    }
    if (item == AppContentBlockEnum.inbox) {
      if (user.data?.inbox_folder_id) {
        setNode({
          id: user.data?.inbox_folder_id,
          ctype: 'folder'
        });
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
    setNode({id: node_id, ctype: node_type});
    setContentBlockItem(AppContentBlockEnum.home);
  }

  if (user.is_pending) {
    return <div>Loading...</div>
  }

  if (user.error) {
    return <SessionEnd />
  }

  if (!user.data?.home_folder_id) {
    return <div>User does not have home folder</div>;
  }

  if (contentBlockItem == AppContentBlockEnum.home) {
    // home
    let home: NType = {
      id: user.data.home_folder_id,
      ctype: 'folder'
    }
      content_block = <DualPanel node={ node || home } />;
  } else if (contentBlockItem == AppContentBlockEnum.inbox) {
    // inbox
    let inbox: NType = {
      id: user.data.inbox_folder_id,
      ctype: 'folder'
    }
    content_block = <DualPanel node={ node || inbox } />;
  } else if (contentBlockItem == AppContentBlockEnum.tags) {
    // tags
    content_block = <Tags />;
  } else if (contentBlockItem == AppContentBlockEnum.users) {
    content_block = <Users />;
  } else if (contentBlockItem == AppContentBlockEnum.groups) {
    content_block = <Groups />;
  } else {
    // search results
    content_block = <SearchResults query={searchQuery} onSearchResultClick={onSearchResultClick} />
  }

  return <Layout
            onContentBlockChange={onContentBlockChange}
            onSearchSubmit={onSearchSubmit}>
              {content_block}
        </Layout>
}

export default App;
