type Role = "A"|"B"|"C"
interface Global {
  A: {};
  B: {};
  C: {};
}
interface LabelledGlobals {
  [key:string]:Global
}
interface Select<R, LS> {
  kind: "select";
  role: R;
  labels: LS;
}
interface Offer<R, LS> {
  kind: "offer";
  role: R;
  labels: LS;
}
interface Close {
  kind: "close"
}
type AtoB<LS extends LabelledGlobals> = {
  A: Select<"B", {[L in keyof LS]: LS[L]["A"]}>;
  B: Offer<"A", {[L in keyof LS]: [L, LS[L]["B"]]}[keyof LS]>;
  C: Merge<LS[keyof LS]["C"]>
}
type BtoA<LS extends LabelledGlobals> = {
  A: Offer<"B", {[L in keyof LS]: [L, LS[L]["A"]]}[keyof LS]>;
  B: Select<"A", {[L in keyof LS]: LS[L]["B"]}>;
  C: Merge<LS[keyof LS]["C"]>
}
type BtoC<LS extends LabelledGlobals> = {
  A: Merge<LS[keyof LS]["A"]>
  B: Select<"C", {[L in keyof LS]: LS[L]["B"]}>;
  C: Offer<"B", {[L in keyof LS]: [L, LS[L]["C"]]}[keyof LS]>;
}
type CtoA<LS extends LabelledGlobals> = {
  A: Offer<"C", {[L in keyof LS]: [L, LS[L]["A"]]}[keyof LS]>;
  B: Merge<LS[keyof LS]["B"]>
  C: Select<"A", {[L in keyof LS]: LS[L]["C"]}>;
}
type Finish = {
  A: Close;
  B: Close;
  C: Close;
}

type assertfalse = undefined

type IfEq<X,Y,T,E> = 
  [X] extends [Y] ? [Y] extends [X] ? T : E : E;

// Filter<"a", ["a",S1]|["b",S2]|["c",S3]|["a",S4]> == S1|S4
type Filter<K, T> = 
  T extends [infer K1, infer S] 
  ? IfEq<K, K1, S, never> 
  : {error:"Internal error: Filter: non-pair type", cause:[K,T]}

// MapFst<["a",S1]|["b",S2]|["c",S3]> == "a"|"b"|"c"
type MapFst<T> = 
  T extends [infer L, {}] 
  ? L 
  : {error:"Internal error: MapFst: non-pair type", cause:T};

type ToIntersection<T> =
  (T extends infer T0 ? (x:T0) => void : never) extends (x:infer T0) => void 
  ? T0 
  : never;

type IsSingletonString<R> =
  [R] extends [string]
  ? [ToIntersection<R>] extends [never] ? false : true
  : false // not a string

// AllKeys<{a:S1} | {b:S2, c:S3}> == "a"|"b"|"c"
type AllKeys<T> =
  T extends infer T0 ? keyof T0 : "assertfalse_str";

type Merge<T> = 
  [T] extends [Offer<string, {}>] 
  ? MergeOffer<T> 
    : [T] extends [Select<string, {}>]
    ? MergeSelect<T>
    : [T] extends [Close]
      ? Close
      : {error: "can't merge", cause:T}

type MergeOffer<T extends Offer<string, {}>> =
  IsSingletonString<T["role"]> extends false
  ? {error:"Offer: can't merge: Destination role conflict", cause:T["role"]} 
  : Offer<T["role"], MergeOfferBranch<T["labels"]>>

type MergeSelect<T extends Select<string, {}>> =
  IsSingletonString<T["role"]> extends false
  ? {error: "Select: can't merge: Destination role conflict", cause:T["role"]}
  : Select<T["role"], MakeSelectBranch<T["labels"]>>

// MergeOfferBranch<["a",S1]|["b",S2]|["a",S3]> == ["a",Merge<S1|S3>]|["b",Merge<S2>]
type MergeOfferBranch<LS> =
  MapFst<LS> extends infer KS 
  ? KS extends infer K
    ? [K, Merge< Filter<K,LS> >]
    : assertfalse
  : assertfalse;

// MakeSelectBranch<{a:S1,b:S2}|{a:S3,b:S4}> == {a:Merge<S1|S2>, b:Merge<S3,S4>}
// MakeSelectBranch<{a:S1,b:S2}|{a:S3}> == ERROR
type MakeSelectBranch<LS> =
  IfEq<AllKeys<LS>, keyof LS,
      {[K in AllKeys<LS>]: K extends keyof LS ? Merge< LS[K] > : assertfalse},
      {error: "Select: can't merge: labels differ", cause: DebugKeys<LS>}>

type DebugKeys<T> = T extends infer T0 ? {keys: keyof T0} : assertfalse

type T1 = Merge<Select<"A", {a:Close}> | Select<"A", {a:Close}>>
// type T1 = Select<"A", {
//     a: Close;
// }>
type T2 = Merge<Offer<"A", ["a",Close]> | Offer<"A", ["b",Select<"A", {c:Close}>]>>
// type T2 = Offer<"A", ["a", Close] | ["b", Select<"A", {
//     c: Close;
// }>]>
type T3 = Merge<Select<"A", {a: Offer<"B", ["x",Close]>}> | Select<"A", {a:Offer<"B", ["y",Close]>}>>
// type T3 = Select<"A", {
//     a: Offer<"B", ["x", Close] | ["y", Close]>;
// }>
type T4 = Merge<Offer<"A", ["L1", Offer<"A", ["L",Close]>]> | Offer<"A", ["L1", Offer<"A", ["R",Close]>]>>      
// type T4 = Offer<"A", ["L1", Offer<"A", ["L", Close] | ["R", Close]>]>

type Err0 = Merge<Select<"A", {a:Close}> | Select<"B", {a:Close}>>
// type Err0 = {
//     error: "Select: can't merge: Destination role conflict";
// }
type Err01 = Merge<Offer<"A", ["a",Close]> | Offer<"B", ["a",Close]>>
// type Err01 = {
//     error: "Offer: can't merge: Destination role conflict";
// }
type Err02 = Merge<Select<"A", {}> | Offer<"B", []>>
// type Err02 = {
//     error: "can't merge";
//     cause: Select<"A", {}> | Offer<"B", []>;
// }
type Err03 = Merge<Select<"A", {"L1": Offer<"A", ["L",Close]>}> | Select<"A", {"L1": Offer<"A", ["R",Close]>, "L2":Close}>>
// type Err03 = Select<"A", {
//     error: "Select: can't merge: labels differ";
//     cause: {
//         keys: "L1";
//     } | {
//         keys: "L1" | "L2";
//     };
// }>
type Err04 = Merge<Select<"A", {"L0":Close, "L1": Offer<"A", ["L",Close]>}> | Select<"A", {"L0":Close}>>
// type Err04 = Select<"A", {
//     error: "Select: can't merge: labels differ";
//     cause: {
//         keys: "L0" | "L1";
//     } | {
//         keys: "L0";
//     };
// }>

type Err1 = Merge<Select<"A", {a:Close}> | Select<"A", {b:Close}>> // labels differ
// type Err1 = Select<"A", {
//     error: "Select: can't merge: labels differ";
//     cause: {
//         keys: "a";
//     } | {
//         keys: "b";
//     };
// }>

type Err12 = Merge<Select<"A", {a:Close, b:Close}> | Select<"A", {b:Close}>> // labels differ
// type Err12 = Select<"A", {
//     error: "Select: can't merge: labels differ";
//     cause: {
//         keys: "a" | "b";
//     } | {
//         keys: "b";
//     };
// }>
type Err2 = Merge<Offer<"A", ["a",Close]> | Offer<"A", ["a",Select<"B", {b:Close}>]>> // continuations of "a" differ
// type Err2 = Offer<"A", ["a", {
//     error: "can't merge";
//     cause: Close | Select<"B", {
//         b: Close;
//     }>;
// }]>
type G0 = AtoB<{a:BtoC<{c:CtoA<{a2:Finish}>}>}>
type SC0 = G0["C"]

type G1 = AtoB<{a:BtoC<{c:CtoA<{a:Finish}>}>, 
                b:BtoC<{c:CtoA<{a:Finish}>, 
                        d:CtoA<{b:Finish}>}>}>
type SC1 = G1["C"]
// type SC1 = Offer<"B", ["c", Select<"A", {
//     a: Close;
// }>] | ["d", Select<"A", {
//     b: Close;
// }>]>
type SC1Test = Merge<Offer<"B", ["c",Select<"A", {a1:Close}>]> | Offer<"B", ["c",Select<"A", {a1:Close}>] | ["d",Select<"A", {a2:Close}>]>>
// type SC1Test = Offer<"B", ["c", Select<"A", {
//     a1: Close;
// }>] | ["d", Select<"A", {
//     a2: Close;
// }>]>
type ErrG2 = AtoB<{a:CtoA<{c:Finish, d:Finish}>, b:CtoA<{d:Finish}>}>
type ErrSC2 = ErrG2["C"]
// type ErrSC2 = Select<"A", {
//     error: "Select: can't merge: labels differ";
//     cause: {
//         keys: "c";
//     } | {
//         keys: "d";
//     };
// }>

