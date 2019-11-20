import React, { useState, useEffect } from "react";

import { from, BehaviorSubject } from "rxjs";
import { mergeMap, distinctUntilChanged, debounceTime } from "rxjs/operators";

import { Layout, Card, Icon, Row, Col, Input, Spin } from "antd";
import "./App.scss";

const { Header, Content, Footer } = Layout;
const { Meta } = Card;
const { Search } = Input;

const getRocketsByName = async name => {
  const allRockets = await fetch(
    "https://api.spacexdata.com/v3/rockets"
  ).then(res => res.json());
  return allRockets.filter(rocket => {
    return rocket.rocket_name.includes(name);
  });
};

let searchSubject = new BehaviorSubject("");
let searchResultObservable = searchSubject.pipe(
  debounceTime(750),
  distinctUntilChanged(),
  mergeMap(val => {
    //from operator: returning an Observable
    return from(getRocketsByName(val));
  })
);

const useObservable = (observable, setter, loading) => {
  //componentDidMount, componentDidUpdate, componentWillUnmount replacement in React Hook
  useEffect(
    () => {
      //Subsribe to get the values of Observable
      let subscription = observable.subscribe(result => {
        setter(result);
        loading(false);
      });
      //Unsubscribe after each re-render
      return () => subscription.unsubscribe();
    },
    //Variables to watch for changes
    //If 2nd parameter not defined,
    //useEffect will run on every re-render
    [observable, setter, loading]
  );
};

function App() {
  //SetState in React Hook
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useObservable(searchResultObservable, setResults, setLoading);

  const handleSearchChange = e => {
    setSearch(e.target.value);
    setLoading(true);
    searchSubject.next(e.target.value);
  };

  return (
    <Layout className="rockets-layout">
      <Header>
        <h1 className="rockets-layout__header-text">SpaceX Open API</h1>
      </Header>
      <Content style={{ padding: "0 50px" }}>
        <div
          style={{
            background: "#fff",
            padding: 24,
            minHeight: 280
          }}
        >
          <Search
            placeholder="Sarch Rockets by Name"
            onChange={handleSearchChange}
            style={{ width: 200 }}
          />
          <Spin spinning={loading}>
            <Row
              type="flex"
              justify="space-between"
              gutter={[{ xs: 8, sm: 16, md: 24, lg: 32 }, 20]}
            >
              {results.map(item => {
                return (
                  <Col xs={24} sm={24} md={12} lg={8} xl={5}>
                    <Card
                      style={{
                        marginBottom: "20px"
                      }}
                      cover={
                        <img
                          alt="example"
                          src={item.flickr_images[0]}
                          style={{
                            height: "250px"
                          }}
                        />
                      }
                      actions={[
                        <Icon type="setting" key="setting" />,
                        <Icon type="edit" key="edit" />,
                        <Icon type="ellipsis" key="ellipsis" />
                      ]}
                    >
                      <Meta
                        title={item.rocket_name}
                        description={item.description}
                        style={{
                          height: "200px"
                        }}
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Spin>
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Ant Design ©2018 Created by Ant UED
      </Footer>
    </Layout>
  );
}

export default App;
