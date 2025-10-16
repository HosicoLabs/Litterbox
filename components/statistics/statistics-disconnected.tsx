'use client'

import { WalletDropdown } from "../wallet-dropdown/wallet-dropdown";
import "./statistics.scss";
import "./statistics-disconnected.scss";

export function StatisticsDisconnected() {
  const mockTokens = [
    {
      symbol: 'XXXX',
      image: null,
      balance: '0.00',
      priceUSD: '0.00'
    },
    {
      symbol: 'XXXX',
      image: null,
      balance: '0.00',
      priceUSD: '0.00'
    },
    {
      symbol: 'XXXX',
      image: null,
      balance: '0.00',
      priceUSD: '0.00'
    }
  ];

  const mockPreviewData = {
    totalValueUSD: 481.35,
    hosicoAmount: 24067.50,
    estimatedSolRecovery: 0.006,
    solRecoveryValueUSD: 0.87,
    selectedCount: 0
  };

  return (
    <div id="statsistics" className="statistics statistics-disconnected">
      <div className="left">
        <div className="table">
          <div className="grid grid-cols-3 gap-4">
            <div className="thead_col h-max">
              <div className="asset-header">
                <div className="checkbox-disabled"></div>
                <span>Asset</span>
              </div>
            </div>
            <div className="thead_col h-max text-left">
              Balance
            </div>
            <div className="thead_col h-max text-left">
              Price (USD)
            </div>
          </div>

          {mockTokens.map((token, index) => (
            <div className="grid grid-cols-3 gap-4" key={`mock-${index}`}>
              <div className="h-max token-row">
                <div className="checkbox-disabled"></div>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-full h-8 max-h-8 min-h-8 w-8 min-w-8 max-w-8">
                  <g clipPath="url(#clip0_2849_7888)">
                    <rect width="32" height="32" rx="16" fill="#030914"></rect>
                    <circle cx="16.0001" cy="16" r="13.3333" stroke="#9498A1" strokeWidth="1.5"></circle>
                    <path d="M13.3335 11.9999C13.3335 10.5272 14.5274 9.33325 16.0002 9.33325C17.4729 9.33325 18.6668 10.5272 18.6668 11.9999C18.6668 12.5308 18.5117 13.0254 18.2443 13.441C17.4474 14.6795 16.0002 15.8605 16.0002 17.3333L16.0002 17.9999" stroke="#9498A1" strokeWidth="1.5" strokeLinecap="round"></path>
                    <path d="M15.9895 22.6666H16.0015" stroke="#9498A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_2849_7888">
                      <rect width="32" height="32" rx="16" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
                <strong>{token.symbol}</strong>
              </div>
              <div className="h-max token-cell">
                {token.balance}
              </div>
              <div className="h-max token-cell">
                ${token.priceUSD}
              </div>
            </div>
          ))}

          <div className="wallet-connect-overlay">
            <h3>
              Connect Your Wallet
            </h3>
            <p>
              Connect your Solana wallet to view your token portfolio and start converting your dust tokens to $HOSICO.
            </p>
            <div className="btn connect-btn">
              <WalletDropdown />
            </div>
          </div>
        </div>

        <div className="sol-balance">
          <strong>SOL balance:</strong> ---.------ SOL
        </div>
      </div>

      <div className="right">
        <div className="preview-header">
          <h3>$HOSICO Conversion Preview</h3>
          <div className="token-count">
            Selected tokens: {mockPreviewData.selectedCount}
          </div>

          <div className="process-info">
            💡 Process: Close accounts → Recover SOL rent → Swap SOL to $HOSICO
          </div>
        </div>

        <ul className="convertion_container">
          <div className="convertion">
            <p className="amount amount-disabled">$---.--</p>
            <p className="status">Total Value (USD)</p>
          </div>
          <div className="convertion">
            <p className="amount amount-disabled">---.-- $HOSICO</p>
            <p className="status">You will receive</p>
          </div>
          <div className="convertion">
            <p className="amount amount-disabled">---.--- SOL</p>
            <p className="status">Est. SOL recovery ($---.--)</p>
          </div>
        </ul>

        <button
          className="btn btn_convert"
          disabled={true}
        >
          Connect Wallet to Convert
        </button>

        <div className="connection-status">
          Connect your wallet to see live conversion rates and start closing your dust tokens.
        </div>

        <div className="price-info">
          $HOSICO Price: $---.------
        </div>
      </div>
    </div>
  );
}