export function CatRain() {
  return (
    <div className="cat-rain" aria-hidden="true">
      {Array.from({ length: 32 }, (_, index) => (
        <span className="cat-rain-cat" key={index}>
          <img src="/cat-easter-egg.jpg" alt="" />
        </span>
      ))}
    </div>
  );
}
