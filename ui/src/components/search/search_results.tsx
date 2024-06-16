import { useSearch } from "hooks/search";
import { SearchResult,ColoredTag, CType } from "types";
import Tag from "components/tags/tag";
import IconHouse from 'components/icons/house';
import IconInbox from "components/icons/inbox";
import { useProtectedJpg } from "hooks/protected_image";


type ArgsSearchWrapper = {
  query: string;
  onSearchResultClick: (
    node_id: string,
    node_type: CType,
    page_number: number | null
  ) => void;
}


type ArgsSearchResults = {
  items: SearchResult[] | null;
  onSearchResultClick: (
    node_id: string,
    node_type: CType,
    page_number: number | null
  ) => void;
}

type ArgsSearchResultItem = {
  item: SearchResult;
  onClick: (
    node_id: string,
    node_type: CType,
    page_number: number | null
  ) => void;
}


function Tags({items}: {items: Array<ColoredTag>}) {
  let comps = items.map(
    (item: ColoredTag) => <div className="mx-1">{<Tag item={item} />}</div>
    );

  return (
    <div className="tags d-flex mx-4">
      {comps}
    </div>
  );
}


function BreadcrumbItem({item}: {item: [string, string]}) {
  if (item[1] == '.home') {
    return (
      <div className="breadcrumb-item">
        <IconHouse /> Home
      </div>
    );
  }

  if (item[1] == '.inbox') {
    return (
      <div className="breadcrumb-item">
        <IconInbox /> Inbox
      </div>
    );
  }

  return (
    <div className="breadcrumb-item">
      {item[1]}
    </div>
  );
}


function Breadcrumb({items}: {items: Array<[string, string]>}) {
  let comps = items.map(
    (item: [string, string]) => <BreadcrumbItem item={item} />
  );

  return (
    <div className="breadcrumb text-body-secondary ps-3 mb-0">
      {comps}
    </div>
  );
}


function SearchResultDocument({item, onClick}: ArgsSearchResultItem) {
  const protected_thumbnail = useProtectedJpg(`/api/thumbnails/${item.document_id}`);
  let thumbnail_component: JSX.Element | null;

  const localOnClick = () => {
    let node_id: string;
    let page_number: number;

    node_id = (item.document_id == null) ? '' : item.document_id;
    page_number = (item.page_number == null) ? 0 : item.page_number;

    onClick(node_id, 'document', page_number);
  }

  if (protected_thumbnail.is_loading) {
    thumbnail_component = <div className="icon document"></div>;
  } else if ( protected_thumbnail.error ) {
    thumbnail_component = <div>{protected_thumbnail.error}</div>
  } else {
    thumbnail_component = <div className="image">
      {protected_thumbnail.data}
    </div>
  }

  return (
    <div className="sr-node ps-2">
      <div className="node document">
        {thumbnail_component}
        <div onClick={localOnClick} className="title">{item.title}</div>
        <Tags items={item.tags} />
      </div>
    </div>
  );
}


function SearchResultFolder({item, onClick}: ArgsSearchResultItem) {

  const localOnClick = () => {
    onClick(item.id, 'folder', null);
  }

  return (
    <div className="sr-node ps-2">
      <div className="node folder">
        <div className="icon folder"></div>
        <div onClick={localOnClick} className="title">{item.title}</div>
        <Tags items={item.tags} />
      </div>
    </div>
  );
}


function SearchResults({items, onSearchResultClick}: ArgsSearchResults) {
  if (items && items.length == 0)  {
    return <div>No results found</div>;
  }

  if (!items) {
    return <div>No results found</div>;
  }

  /**
  Search results are returned per page. But for this moment we won't use
  this feature and act as if results are returned per document.

  Remove items which belong to the same document.
  Search results will be grouped per document, but at this point,
  as the viewer cannot pe opened at specific page number
  we will just remove "duplicate results".
  "Duplicate results" = set of pages items that belong to the same document.
  */

  const result_items = items.map((item: SearchResult) => {
    if (item.entity_type == 'folder') {
      return <SearchResultFolder
        key={item.id}
        item={item}
        onClick={onSearchResultClick} />
    } else {
      return <SearchResultDocument
        key={item.id}
        item={item}
        onClick={onSearchResultClick} />
    }
  })

  return <div>{result_items}</div>;
}


function SearchResultsWrapper({query, onSearchResultClick}: ArgsSearchWrapper) {
  const { data, error, is_loading } = useSearch(query);

  if (is_loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (<>
    <SearchResults items={data} onSearchResultClick={onSearchResultClick} />
  </>)
}

export default SearchResultsWrapper;
