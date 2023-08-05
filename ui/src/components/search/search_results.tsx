import { useSearch } from "hooks/search";
import { SearchResult } from "types";

type ArgsSearchWrapper = {
  query: string;
}


type ArgsSearchResults = {
  items: SearchResult[] | null;
}

type ArgsSearchResultItem = {
  item: SearchResult;
}


function SearchResultDocument({item}: ArgsSearchResultItem) {
  return (
    <div className="node document">
      <div className="icon document"></div>
      <div>{item.document_id} {item.title}</div>
    </div>
  );
}


function SearchResultFolder({item}: ArgsSearchResultItem) {
  return (
    <div className="node folder">
      <div className="icon folder"></div>
      <div>{item.id} {item.title}</div>
    </div>
  );
}


function SearchResults({items}: ArgsSearchResults) {

  if (items && items.length == 0)  {
    return <div>No results found</div>;
  }

  if (!items) {
    return <div>No results found</div>;
  }

  const result_items = items.map((item: SearchResult) => {
    if (item.entity_type == 'folder') {
      return <SearchResultFolder key={item.id} item={item} />
    } else {
      return <SearchResultDocument key={item.id} item={item} />
    }
  })

  return <div>{result_items}</div>;
}


function SearchResultsWrapper({query}: ArgsSearchWrapper) {
  const { data, error, is_loading } = useSearch(query);

  if (is_loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (<>
    <SearchResults items={data}/>
  </>)
}

export default SearchResultsWrapper;
