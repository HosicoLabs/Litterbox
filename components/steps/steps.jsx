const STEPS = [
  {
    title: "Connect & Scan",
    desc: "Connect your wallet and let Litter Box analyze its contents. It detects unwanted tokens, spam airdrops, and closeable accounts, then organizes them into a simple list for review.",
  },
  {
    title: "Review & Choose",
    desc: "Carefully review the tokens and choose which ones to remove.You can select them individually or use Dump All to clear everything at once.",
  },
  {
    title: "Confirm Cleanup",
    desc: "Confirm your selection with a single signature.Litter Box will close token accounts, reclaim rent, and swap or burn the tokens, leaving your wallet clean and optimized.",
  },
  {
    title: "Confirm Cleanup",
    desc: "Confirm your selection with a single signature.Litter Box will close token accounts, reclaim rent, and swap or burn the tokens, leaving your wallet clean and optimized.",
  },
];
export function Steps() {
  return (
    <ul id="steps" className="steps_container">
      {STEPS.map((el, i) => {
        return (
          <li key={i} className="step">
            <span className="number">0{i + 1}</span>
            <p className="title">{el.title}</p>
            <div className="desc">{el.desc}</div>
          </li>
        );
      })}
    </ul>
  );
}
