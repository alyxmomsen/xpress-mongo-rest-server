print([(lambda _:_**(_:=2))(_) for _ in range(10)[::-1]])