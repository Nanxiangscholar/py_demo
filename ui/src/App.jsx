import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout, Menu, ConfigProvider, App } from "antd";
import { FacilitiesPage } from "./pages/FacilitiesPage";
import { MetricsPage } from "./pages/MetricsPage";
import { MetricValuesPage } from "./pages/MetricValuesPage";
import { MessageProvider } from "./contexts/MessageContext";

const { Header, Content, Sider } = Layout;

const customTheme = {
  token: {
    fontSize: 16,
    colorPrimary: '#003a74',
    colorBgContainer: '#ffffff',
    colorBgLayout: 'rgb(240, 242, 245)',
    borderRadius: 4,
  },
  components: {
    Layout: {
      headerBg: '#003a74',
      headerHeight: 64,
    },
    Menu: {
      itemSelectedBg: '#e6f0f9',
      itemSelectedColor: '#003a74',
    },
    Table: {
      headerBg: '#d7dee9',
      headerColor: 'rgba(13, 43, 74, 1)',
    },
  },
};

function AppLayout() {
  const location = useLocation();

  const menuItems = [
    {
      key: "/",
      label: <Link to="/">设施管理</Link>,
    },
    {
      key: "/metrics",
      label: <Link to="/metrics">指标管理</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{
        display: "flex",
        alignItems: "center",
        background: "#003a74",
        padding: "0 24px",
        height: 64,
        lineHeight: "64px",
      }}>
        <h1 style={{
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 600,
          margin: 0,
        }}>
          设施管理系统
        </h1>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: "#ffffff" }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: "100%", borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: "24px", background: "rgb(240, 242, 245)" }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: "#ffffff",
              borderRadius: 4,
            }}
          >
            <Routes>
              <Route path="/" element={<FacilitiesPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="/metrics/:metricId/values" element={<MetricValuesPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

function Application() {
  return (
    <ConfigProvider theme={customTheme}>
      <App>
        <MessageProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </MessageProvider>
      </App>
    </ConfigProvider>
  );
}

export default Application;
