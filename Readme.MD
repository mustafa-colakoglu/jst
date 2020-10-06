# JST

Jst writing for build web page like PHP.

Now you can use variables and print this variables

## Examples

```
<?jst
    const title = "test page";
    const content = "test content";
?>
<html>
    <head>
        <title><?jst
            print(title);
        ?></title>
    </head>
    <body>
        <?jst
            print(content);
        ?>
        <img src="/test.png" />
    </body>
</html>
```
## POST and GET usage

You can use POST and GET variables

```
<?jst
    print(POST.name)
?>
```

or

```
<?jst
    print(GET.name)
?>
```
### Contributors

Now just me :D. You can send me pull request for contibution.