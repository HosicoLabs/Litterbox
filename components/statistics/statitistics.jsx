const SERACH_ICON = (
  <svg
    className="icon icon_search"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M21 21L17.5001 17.5M20 11.5C20 16.1944 16.1944 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5Z"
      stroke="#FFBB00"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L17.5001 17.5M20 11.5C20 16.1944 16.1944 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5Z"
      stroke="black"
      strokeOpacity="0.2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CHECKBOX_ICON = (
  <svg
    className="icon icon_checkbox"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4Z"
      fill="#FFBB00"
    />
    <path
      d="M12 5L6.5 10.5L4 8"
      stroke="white"
      strokeWidth="1.6666"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CHEVDOWN_ICON = (
  <svg
    className="icon icon_chevdown"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M4.25 6.125L8 9.875L11.75 6.125"
      stroke="#FFBB00"
      strokeWidth="0.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CONVERTION_AVAIL = [
  {
    amount: 625,
    status: "possible convert",
  },
  {
    amount: 842,
    status: "possible convert",
  },
];

export function Statistics() {
  return (
    <div id="statsistics" className="statistics">
      <div className="left">
        <div className="header">
          <div className="input input_search">
            {SERACH_ICON}
            <input type="text" placeholder="search assest" />
          </div>
          <div className="input input_filter">
            <span className="label">filter</span>
            {CHEVDOWN_ICON}
          </div>
          <div className="input input_shorts">
            <span className="label">shorts</span>
            {CHEVDOWN_ICON}
          </div>
        </div>
        <table className="table">
          <thead>
            <tr className="thead">
              <th className="thead_col">
                {CHECKBOX_ICON}
                <span>symbol</span>
              </th>
              <th className="thead_col">balance</th>
              <th className="thead_col">value (Sol)</th>
              <th className="thead_col">fee ($Hosico)</th>
              <th className="thead_col">token list</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <div className="right">
        <ul className="convertion_container">
          {CONVERTION_AVAIL.map((transaction, i) => {
            return (
              <div key={i} className="convertion">
                <p className="amount">${transaction.amount}</p>
                <p className="status">{transaction.status}</p>
              </div>
            );
          })}
        </ul>
        <button className="btn btn_convert">convert</button>
      </div>
    </div>
  );
}
