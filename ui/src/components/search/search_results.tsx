import { useSearch } from "hooks/search";
import { SearchResult, CType } from "types";

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


function Tags({items}: {items: Array<string>}) {
  let comps = items.map((item: string) => <div className="mx-1">{item}</div>);

  return (
    <div className="tags d-flex mx-4">
      {comps}
    </div>
  );
}


function Breadcrumb({items}: {items: Array<string>}) {
  let comps = items.map((item: string) => <div className="breadcrumb-item">{item}</div>);

  return (
    <div className="breadcrumb text-body-secondary ps-3 mb-0">
      {comps}
    </div>
  );
}


function SearchResultDocument({item, onClick}: ArgsSearchResultItem) {

  const localOnClick = () => {
    let node_id: string;
    let page_number: number;

    node_id = (item.document_id == null) ? '' : item.document_id;
    page_number = (item.page_number == null) ? 0 : item.page_number;

    onClick(node_id, 'document', page_number);
  }

  return (
    <div className="sr-node ps-2">
      <Breadcrumb items={item.breadcrumb} />
      <div className="node document">
        <div className="icon document"></div>
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
      <Breadcrumb items={item.breadcrumb} />
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
