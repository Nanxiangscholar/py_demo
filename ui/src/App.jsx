import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout, Menu, ConfigProvider, App as AntdApp } from "antd";
import { FacilitiesPage } from "./pages/FacilitiesPage";
import { MetricsPage } from "./pages/MetricsPage";
import { MetricValuesPage } from "./pages/MetricValuesPage";
import { MessageProvider } from "./contexts/MessageContext";

const { Header, Content } = Layout;

function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      color: "#9ca3af",
      fontSize: "14px",
      fontWeight: "500",
      fontFamily: "Consolas, Monaco, monospace",
      letterSpacing: "1px",
      padding: "8px 16px",
      borderRadius: "8px",
    }}>
      {time.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })}
    </div>
  );
}

const customTheme = {
  token: {
    fontSize: 14,
    colorPrimary: '#8b5cf6',
    colorPrimaryBg: 'rgba(139, 92, 246, 0.15)',
    colorBgContainer: '#1a1a2e',
    colorBgElevated: '#1f1f35',
    colorBgLayout: '#0d0d1a',
    colorBorder: '#2a2a40',
    colorText: '#e4e4e7',
    colorTextSecondary: '#a1a1aa',
    colorBgSpotlight: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    boxShadowSecondary: '0 8px 30px rgba(0,0,0,0.5)',
  },
  components: {
    Layout: {
      headerBg: 'transparent',
      headerHeight: 64,
      siderBg: '#12121f',
    },
    Menu: {
      itemSelectedBg: 'rgba(139, 92, 246, 0.5)',
      itemSelectedColor: '#ffffff',
      itemActiveBg: 'rgba(139, 92, 246, 0.3)',
      itemBorderRadius: 10,
      margin: 8,
      itemPaddingInlineDirection: 12,
      darkItemBg: '#1a1a2e',
      darkItemSelectedBg: 'rgba(139, 92, 246, 0.6)',
      darkItemSelectedColor: '#ffffff',
    },
    Table: {
      headerBg: '#1f1f35',
      headerColor: '#c4b5fd',
      headerSplitColor: '#2a2a40',
      borderColor: '#2a2a40',
      rowHoverBg: 'rgba(139, 92, 246, 0.08)',
      colorBgContainer: '#1a1a2e',
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: '#1a1a2e',
      borderColor: '#2a2a40',
    },
    Button: {
      borderRadius: 10,
      controlHeight: 38,
      primaryShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
      defaultShadow: '0 2px 8px rgba(0,0,0,0.3)',
      colorPrimary: '#8b5cf6',
    },
    Input: {
      borderRadius: 10,
      colorBgContainer: '#1f1f35',
      colorBorder: '#2a2a40',
      colorText: '#e4e4e7',
      colorTextPlaceholder: '#71717a',
    },
    Select: {
      borderRadius: 10,
      colorBgContainer: '#1f1f35',
      colorBorder: '#2a2a40',
      colorText: '#e4e4e7',
      optionSelectedBg: 'rgba(139, 92, 246, 0.2)',
    },
    Modal: {
      contentBg: '#1a1a2e',
      headerBg: '#1f1f35',
      colorBorder: '#2a2a40',
    },
    Tag: {
      borderRadius: 6,
    },
  },
};

function AppLayout() {
  const location = useLocation();

  const menuItems = [
    {
      key: "/",
      label: <Link to="/" style={{ color: "#d1d5db", fontSize: "15px", fontWeight: "500" }}>设施管理</Link>,
    },
    {
      key: "/metrics",
      label: <Link to="/metrics" style={{ color: "#d1d5db", fontSize: "15px", fontWeight: "500" }}>指标管理</Link>,
    },
  ];

  return (
    <Layout style={{ height: "100vh", background: "#0d0d15", overflow: "hidden" }}>
      <Header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1a1a2e",
        padding: "0 40px",
        height: 60,
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        borderBottom: "1px solid #2d2d44",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          minWidth: "200px",
        }}>
          <div style={{
            width: 36,
            height: 36,
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* 建筑物轮廓 */}
              <path d="M4 4L7 4L7 20H17L17 4L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 4L12 2L20 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* 服务器/机架 */}
              <rect x="9" y="8" width="6" height="2" rx="0.5" fill="white"/>
              <rect x="9" y="11" width="6" height="2" rx="0.5" fill="white"/>
              <rect x="9" y="14" width="6" height="2" rx="0.5" fill="white"/>
              {/* 数据点 */}
              <circle cx="17" cy="10" r="1" fill="white"/>
              <circle cx="17" cy="14" r="1" fill="white"/>
              <circle cx="17" cy="18" r="1" fill="white"/>
              {/* 连接线 */}
              <path d="M14 12L16 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 16L16 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 15L14 18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            color: "#f3f4f6",
            fontSize: 17,
            fontWeight: 600,
            margin: 0,
            letterSpacing: "0.5px",
          }}>
            设施管理系统
          </h1>
        </div>

        <div style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
        }}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            style={{
              background: "transparent",
              border: "none",
              minWidth: "200px",
            }}
            items={menuItems}
            theme="dark"
          />
        </div>

        <TimeDisplay />
      </Header>

      <Layout style={{ padding: "24px", background: "#0d0d15", overflow: "hidden" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            height: "calc(100vh - 60px - 48px)",
            background: "#1a1a2e",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            border: "1px solid #2d2d44",
            overflowY: "auto",
            overflowX: "hidden",
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
  );
}

function Application() {
  return (
    <ConfigProvider theme={customTheme}>
      <AntdApp>
        <MessageProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </MessageProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default Application;
