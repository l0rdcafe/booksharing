import React from "react";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

class Trades extends React.Component {
  constructor() {
    super();
    this.state = { loading: true };
  }
  async componentDidMount() {
    try {
      const res = await fetch("/trades");
      const result = await res.json();

      if (res.status === 200) {
        this.setState({ trades: result.trades, loading: false });
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      this.setState({ error: e.message, loading: false });
    }
  }
  render() {
    const { loading, trades, error } = this.state;
    console.log(this.state)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignContent: "center" }}>
        {loading && <Typography variant="body2">Loading...</Typography>}
        {!loading && error && <Typography color="error" variant="body2">{error}</Typography>}
        {!loading && trades.length > 0 &&
          <List>
            {trades.map(trade => (
              <ListItem key={trade.tradeId}>
                <ListItemText primary={
                  <div style={{ display: "flex" }}>
                    <Typography variant="body1" align="center" style={{ flex: 1 }}><strong>{trade.to.username}</strong> traded:</Typography>
                    <Typography variant="body1" align="center" style={{ flex: 1 }}>For <strong>{trade.from.username}</strong>'s:</Typography>
                  </div>
                } secondary={
                  <div style={{ display: "flex", borderRadius: "2px", border: "2px solid #ccc" }}>
                    <List style={{ flex: 1, borderRight: "1px solid #ccc" }}>
                      {trade.to.books.map(book => (
                        <ListItem key={book.bookId}>
                          <ListItemText primary={book.title} secondary={book.description} />
                        </ListItem>
                      ))}
                    </List>
                    <List style={{ flex: 1, borderLeft: "1px solid #ccc" }}>
                      {trade.from.books.map(book => (
                        <ListItem key={book.bookId}>
                          <ListItemText primary={book.title} secondary={book.description} />
                        </ListItem>
                      ))}
                    </List>
                  </div>
                } />
              </ListItem>
            ))}
          </List>
        }
        {!loading && !trades.length && <Typography variant="body1">There are no completed trades yet.</Typography>}
      </div>
    );
  }
}

export default Trades;
